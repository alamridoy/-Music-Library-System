const express = require("express");
const isEmpty = require("is-empty");
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken')
const {check,validationResult} = require('express-validator')
const moment = require("moment");
const artistModel = require('../models/artist');
const songModel = require('../models/song');
const albumModel = require('../models/album');
const fileUpload = require('express-fileupload')
const path = require('path')
const fs = require('fs');
router.use(fileUpload());




// create song 
router.post('/add', verifyToken, [
    // Example body validations
    check('title').isString().withMessage('Please provide a valid title.'),
    check('duration').isTime().withMessage('Please give a valid duration time format 5:25 min and sec.'),
    check('album_id').isInt().withMessage('Please give a valid album id.'),
    check('artist_id').isInt().withMessage('Please give a valid artist id.'),
  ],
  async (req, res) => {
    // Handle the request only if there are no validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
 
  try {
     
      // body data
    let reqData = {
        "title": req.body.title,
        "duration":req.body.duration,
        "album_id":req.body.album_id,
        "artist_id":req.body.artist_id,
   }

    let current_date = new Date(); 
    let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    reqData.created_at = current_time;
    reqData.updated_at = current_time;

    // default 1 because this system has only one role
    reqData.created_by = 1
    reqData.updated_by = 1


    // check song title empty or not and check length
    if(isEmpty(reqData.title)){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Song title cannot be empty."
        });
    }else if(reqData.title.length > 50){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"This title should be maximum 50 character."
        });
    }


    // existing song title in database
      let existingTitle = await songModel.getByTitle(reqData.title)
      if(!isEmpty(existingTitle)){
          return res.status(409).send({
              "success": false,
              "status": 409,
              "message":"This song title already exists."
            });
      }


    // check duration
    if(isEmpty(reqData.duration)){
      return res.status(400).send({
        "success": false,
        "status": 400,
        "message":"Song duration cannot be empty."
      });
    }else if(reqData.duration < 0){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"This song duration can not be less than 0."
        });
    }


  // check album id
   //check artist id empty or not
   if(isEmpty(reqData.album_id)){
    return res.status(400).send({
          "success": false,
          "status": 400,
          "message": "Album id should not be empty."
    });
  }else if(reqData.album_id < 1){
      return res.status(400).send({
          "success": false,
          "status": 400,
          "message": "Album id should be positive number."
    });
  }



  //existing album id in database
  let existingByAlbumId = await albumModel.getById(reqData.album_id)
  if(isEmpty(existingByAlbumId)){
      return res.status(404).send({
          "success": false,
          "status": 404,
          "message": `This album not found. `
   });
  }


    // check artist id
   //check artist id empty or not
   if(isEmpty(reqData.artist_id)){
    return res.status(400).send({
          "success": false,
          "status": 400,
          "message": "Artist id should not be empty."
    });
  }else if(reqData.artist_id < 1){
      return res.status(400).send({
          "success": false,
          "status": 400,
          "message": "Artist id should be positive number."
    });
  }

  //existing album id in database
  let existingByArtistId = await artistModel.getById(reqData.artist_id)
  if(isEmpty(existingByArtistId)){
      return res.status(404).send({
          "success": false,
          "status": 404,
          "message": `This artist id not found.`
   });
  }


   
  // song file upload
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send({
      "success": false,
      "status": 400,
      "message": "This music file should not be empty."
    });
  }
  
  const musicFile = req.files.music;
  
  // Check file type
  const allowedFileExtensions = ['.mp3'];
  const fileExtension = path.extname(musicFile.name).toLowerCase();
  
  if (!allowedFileExtensions.includes(fileExtension)) {
    return res.status(400).send({
      "success": false,
      "status": 400,
      "message": "Invalid file type. Only MP3 files are allowed."
    });
  }
  
  // Check file size
  const maxFileSize = 20 * 1024 * 1024; // max size 20 MB
  if (musicFile.size > maxFileSize) {
    return res.status(400).send({
      "success": false,
      "status": 400,
      "message": "File size exceeds the maximum limit of 20MB."
    });
  }
  
  // Save the file to the specified destination folder
  const uploadPath = path.join('./songs/mp3', musicFile.name);
  
  musicFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send({
        "success": false,
        "status": 500,
        "message": "Error uploading music file."
      });
    }
  })
    // Add the file path to reqData
    reqData.file_path = uploadPath;
    reqData.file_name = musicFile.name;
     
    delete reqData.file_path



    // save in database
    let result = await songModel.addNew(reqData);

    if (result.affectedRows == undefined || result.affectedRows < 1) {
      return res.status(500).send({
          "success": true,
          "status": 500,
          "message": "Something Wrong in system database."
        });
    }

    return res.status(201).send({
        "success": true,
        "status": 201,
        "message": "Song added Successfully."
    });
    

    } catch (error) {

      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
});


// list 
router.get('/list', verifyToken, async (req, res) => {

  let result = await songModel.getList();

  //get album name and artist name
  for (let index = 0; index < result.length; index++) {
    const song_data = result[index];

    // get album id by title
    let albumInfo = await albumModel.getById(song_data.album_id)
     // if database deleted album it handle empty string
    if(isEmpty(albumInfo)){
      result[index].album_title = ""
     }else{
      result[index].album_title = albumInfo[0].title
     }
    

     // get artist id by name
     let artistInfo = await artistModel.getById(song_data.artist_id)
      // if database deleted artist it handle empty string
     if(isEmpty(artistInfo)){
      result[index].artist_name = ""
     }else{
      result[index].artist_name = artistInfo[0].name
     }
     
     

}

  return res.status(200).send({
      "success": true,
      "status": 200,
      "message": "Song List.",
      "count": result.length,
      "data": result
  });
});


//details
router.get('/details/:id',verifyToken,[
    // Example body validations
    check('id').isInt().withMessage('Please provide a number'),
  ],
  async (req, res) => {
    // Handle the request only if there are no validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }


    let id = req.params.id

    // get id wise data form db 
    let result = await songModel.getById(id);

    // check this id already existing in database or not
    if (isEmpty(result)) {
          return res.status(404).send({
            success: false,
            status: 404,
            message: "Song data not found."
        });
    
      } 
    
  
    //get album name and artist name
    // get album id by title
    let albumInfo = await albumModel.getById(result[0].album_id)
     // if database deleted album it handle empty string
    if(isEmpty(albumInfo)){
      result[0].album_title = ""
     }else{
      result[0].album_title = albumInfo[0].title
     }
    

     // get artist id by name
     let artistInfo = await artistModel.getById(result[0].artist_id)
      // if database deleted artist it handle empty string
     if(isEmpty(artistInfo)){
      result[0].artist_name = ""
     }else{
      result[0].artist_name = artistInfo[0].name
     }

    delete  result[0].created_at
    delete  result[0].updated_at


  return res.status(200).send({
      success: true,
      status: 200,
      message: "Artist details.",
      data: result[0],
  });
      
    

});



//delete
router.delete('/delete',verifyToken,[
  // Example body validations
  check('id').isInt().withMessage('Please provide a number'),
],async (req, res) => {
  // Handle the request only if there are no validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }


  let id = req.body.id

  // get id wise data form db 
  let existingById = await songModel.getById(id);

  // check this id already existing in database or not
  if (isEmpty(existingById)) {
    return res.status(404).send({
      success: false,
      status: 404,
      message: "Song data not found."
    });

  } 

  let current_date = new Date(); 
  let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");

  let data = {
    status : 0,   // status = 1 (active) and status = 0 (delete)
    updated_at :current_time
   }

    // get id wise data form db 
    let result = await songModel.updateById(id,data);

     if (result.affectedRows == undefined || result.affectedRows < 1) {
         return res.status(500).send({
             "success": true,
             "status": 500,
             "message": "Something Wrong in system database."
         });
     }
   
   
     return res.status(200).send({
         "success": true,
         "status": 200,
         "message": "Song successfully deleted."
     });
  

});

  

//update
router.put('/update', verifyToken, [
  // Example body validations
  check('id').isInt().withMessage('Please provide a number'),
  check('title').isString().withMessage('Please provide a string'),
  check('duration').isTime().withMessage('Please give a valid duration time.'),
  check('album_id').isInt().withMessage('Please give a valid album id.'),
  check('artist_id').isInt().withMessage('Please give a valid artist id.'),
],
async (req, res) => {
  // Handle the request only if there are no validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors });
  }



      // body data
      let reqData = {
        "id": req.body.id,
        "title": req.body.title,
        "duration":req.body.duration,
        "album_id":req.body.album_id,
        "artist_id":req.body.artist_id,
   }

  let current_date = new Date(); 
  let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
  reqData.updated_at = current_time;


   
  // get artist all info
  let existingDataById = await songModel.getById(reqData.id)
  if (isEmpty(existingDataById)) {
    return res.status(404).send({
        "success": false,
        "status": 404,
        "message": "Artist data not found",
    });
  } 

  let isError = 0
  let updateData = {};
  let willWeUpdate = 0; // 1 = yes , 0 = no;



  // check song name empty or not and check length
  if(existingDataById[0].title !== reqData.title){
    if(isEmpty(reqData.title)){
      return res.status(400).send({
        "success": false,
        "status": 400,
        "message":"Song title cannot be empty."
      });
  }else if(reqData.title.length > 50){
      return res.status(400).send({
        "success": false,
        "status": 400,
        "message":"Song should be maximum 50 character."
      });
  }

  willWeUpdate = 1
  updateData.title = reqData.title

  }


  // check duration
  if(existingDataById[0].duration !== reqData.duration){
    if(isEmpty(reqData.duration)){
      return res.status(400).send({
        "success": false,
        "status": 400,
        "message":"Song duration cannot be empty."
      });
  }else if(reqData.duration < 0){
      return res.status(400).send({
        "success": false,
        "status": 400,
        "message":"This song duration can not be less than 0."
      });
  }
  willWeUpdate = 1
  updateData.duration = reqData.duration
    
  } 


    // check album
    if(existingDataById[0].album_id !== reqData.album_id){
      if(isEmpty(reqData.album_id)){
        return res.status(400).send({
              "success": false,
              "status": 400,
              "message": "Album id should not be empty."
        });
      }else if(reqData.album_id < 1){
          return res.status(400).send({
              "success": false,
              "status": 400,
              "message": "Album id should be positive number."
        });
      }
    
      //existing album id in database
      let existingByAlbumId = await albumModel.getById(reqData.album_id)
      if(isEmpty(existingByAlbumId)){
          return res.status(404).send({
              "success": false,
              "status": 404,
              "message": `This album not found. `
       });
      }
    willWeUpdate = 1
    updateData.album_id = reqData.album_id
      
    } 


        // check artist
        if(existingDataById[0].artist_id !== reqData.artist_id){
          if(isEmpty(reqData.artist_id)){
            return res.status(400).send({
                  "success": false,
                  "status": 400,
                  "message": "Artist id should not be empty."
            });
          }else if(reqData.artist_id < 1){
              return res.status(400).send({
                  "success": false,
                  "status": 400,
                  "message": "Artist id should be positive number."
            });
          }
        
          //existing album id in database
          let existingByArtistId = await artistModel.getById(reqData.artist_id)
          if(isEmpty(existingByArtistId)){
              return res.status(404).send({
                  "success": false,
                  "status": 404,
                  "message": `This artist id not found.`
           });
          }
        willWeUpdate = 1
        updateData.album_id = reqData.album_id
          
        } 


         
  // song file upload
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send({
      "success": false,
      "status": 400,
      "message": "This music file should not be empty."
    });
  }
  
  const musicFile = req.files.music;
  
  // Check file type
  const allowedFileExtensions = ['.mp3'];
  const fileExtension = path.extname(musicFile.name).toLowerCase();
  
  if (!allowedFileExtensions.includes(fileExtension)) {
    return res.status(400).send({
      "success": false,
      "status": 400,
      "message": "Invalid file type. Only MP3 files are allowed."
    });
  }
  
  // Check file size
  const maxFileSize = 20 * 1024 * 1024; // max size 20 MB
  if (musicFile.size > maxFileSize) {
    return res.status(400).send({
      "success": false,
      "status": 400,
      "message": "File size exceeds the maximum limit of 20MB."
    });
  }

  
  // Save the file to the specified destination folder
  const uploadPath = path.join('./songs/mp3', musicFile.name);
  
  musicFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send({
        "success": false,
        "status": 500,
        "message": "Error uploading music file."
      });
    }
  })
    
    willWeUpdate = 1
    // Add the file path to reqData
    updateData.file_path = uploadPath;
    updateData.file_name = musicFile.name;
     
    delete updateData.file_path



  if (isError == 1) {
    return res.status(400).send({
        "success": false,
        "status": 400,
        "message": errorMessage
    });
}


if (willWeUpdate == 1) {

  updateData.updated_at = current_time
  updateData.updated_by = 1 // default


  let result = await songModel.updateById(reqData.id,updateData);


  if (result.affectedRows == undefined || result.affectedRows < 1) {
      return res.status(500).send({
          "success": true,
          "status": 500,
          "message": "Something Wrong in system database."
      });
  }


  return res.status(200).send({
      "success": true,
      "status": 200,
      "message": "Song successfully updated."
  });


} else {
  return res.status(200).send({
      "success": true,
      "status": 200,
      "message": "Nothing to update."
  });
}

});



module.exports = router;  