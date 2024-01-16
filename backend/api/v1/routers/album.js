const express = require("express");
const isEmpty = require("is-empty");
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken')
const {check,validationResult} = require('express-validator')
const moment = require("moment");
const artistModel = require('../models/artist');
const genreModel = require('../models/genre');
const albumModel = require('../models/album');
const albumWiseArtistModel = require('../models/album-wise-artist');




//add
router.post('/add', verifyToken, [
    // Example body validations
    check('title').isString().withMessage('Please provide a string'),
    check('release_year').isInt().withMessage('Please give a valid year.'),
    check('genre_id').isInt().withMessage('Please give a valid genre id.'),
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
        "release_year":req.body.release_year,
        "genre_id":req.body.genre_id,
        "artist_id":req.body.artist_id
    }

    let current_date = new Date(); 
    let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    reqData.created_at = current_time;
    reqData.updated_at = current_time;

    // reqData.created_by = req.decoded.userInfo.id;
    // reqData.updated_by = req.decoded.userInfo.id;


    // check album title empty or not and check length
    if(isEmpty(reqData.title)){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Album title cannot be empty."
        });
    }else if(reqData.title.length > 50){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Album title should be maximum 50 character."
        });
    }

    // title existing database
    let existingTitle = await albumModel.getByTitle(reqData.title)
    if(!isEmpty(existingTitle)){
        return res.status(409).send({
            "success": false,
            "status": 409,
            "message":"This title already exists."
          });
    }



    // check valid release year
    if(isEmpty(reqData.release_year)){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Album release year cannot be empty."
        });
    }else if(reqData.release_year < 1){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Please give positive number."
        });
    }else if(reqData.release_year > current_date.getFullYear()){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Please give valid year witch is equal this year or less than."
        });
    }


    // genre validation
    if(isEmpty(reqData.genre_id)){
        return res.status(400).send({
            "success": false,
            "status": 400,
            "message":"Genre id cannot be empty."
          });
    }else if(reqData.genre_id < 1){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Please give positive number."
        });
    }


    // check existing genre id in db
    let existingByGenreId = await genreModel.getById(reqData.genre_id)
    if(isEmpty(existingByGenreId)){
        return res.status(404).send({
            "success": false,
            "status": 404,
            "message": "This genre id not found."
        });
    }





    // validate artist id and artist id can be single or multiple
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
    }else if(!Array.isArray(reqData.artist_id)){
        return res.status(400).send({
            "success": false,
            "status": 400,
            "message": "Artist id should be array."
      });
    }

    // check this artist existing in db
    let artistDataById = []
    for (let artistId = 0; artistId < reqData.artist_id.length; artistId++) {
        const artist_data = reqData.artist_id[artistId];
        
        let existingByArtistId = await artistModel.getById(artist_data)
        if(isEmpty(existingByArtistId)){
            return res.status(404).send({
                "success": false,
                "status": 404,
                "message": `This artist no ${artistId+1} id not found. `
        });
    }


    artistDataById.push(artist_data)

    // check duplicate artist id
    let checkArtistIdISDuplicate = await duplicateCheckInArray(artistDataById)
    if(checkArtistIdISDuplicate.result == true){
        return res.status(409).send({
            "success": false,
            "status": 409,
            "message": "Duplicate value found"
      });
     }

     validateArtistId = artistDataById

 }
 
  let albumData ={
    title : reqData.title,
    release_year : reqData.release_year,
    genre_id : reqData.genre_id,
    created_at: reqData.created_at,
    updated_at: reqData.updated_at
  }


    
    // save in database album and artist wise album table using transaction
    let result = await albumModel.addNew(albumData,validateArtistId);


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
      "message": "Album added Successfully."
  });
   
} catch (error) {
      

      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
}

});



// list
router.get('/list', verifyToken, async (req, res) => {

    let result = await albumModel.getList();

    let crackArr = []
    for (let index = 0; index < result.length; index++) {
        const albumData = result[index];

        // get genre id by title
        let genreData = await genreModel.getById(albumData.genre_id)
        result[index].genre_title = genreData[0].title

        // album id store this array
        crackArr.push(albumData.id)
    }


  
    return res.status(200).send({
        "success": true,
        "status": 200,
        "message": "Artist List.",
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
    let result = await albumModel.getById(id);;

     // check this id already existing in database or not
     if (isEmpty(result)) {
        return res.status(404).send({
          success: false,
          status: 404,
          message: "Album data not found."
        });
  
      } 


    const albumData = result[0];

    // get genre id by title
    let genreData = await genreModel.getById(albumData.genre_id)
    result[0].genre_title = genreData[0].title


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
    let existingById = await albumModel.getById(id);
  
    // check this id already existing in database or not
    if (isEmpty(existingById)) {
      return res.status(404).send({
        success: false,
        status: 404,
        message: "Album data not found."
      });
  
    } 
  
    let current_date = new Date(); 
    let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
  
    let data = {
      status : 0,   // status = 1 (active) and status = 2 (delete)
      updated_at :current_time
     }
  
      // get id wise data form db 
      let result = await albumModel.updateById(id,data);
  
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
           "message": "Album successfully deleted."
       });
    
  
  });



//update
router.put('/update', verifyToken, [
    // Example body validations
    check('title').isString().withMessage('Please provide a string'),
    check('release_year').isInt().withMessage('Please give a valid year.'),
    check('genre_id').isInt().withMessage('Please give a valid genre id.'),
    check('artist_id').isInt().withMessage('Please give a valid artist id.'),
  ],
  async (req, res) => {
    // Handle the request only if there are no validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
  
  
      // body data
      let reqData = {
        "id":req.body.id,
        "title": req.body.title,
        "release_year":req.body.release_year,
        "genre_id":req.body.genre_id,
        "artist_id":req.body.artist_id
    }

  
    let current_date = new Date(); 
    let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    reqData.updated_at = current_time;
  
    // reqData.created_by = req.decoded.userInfo.id;
    // reqData.updated_by = req.decoded.userInfo.id;
     
    // get artist all info
    let existingDataById = await albumModel.getById(reqData.id)
    if (isEmpty(existingDataById)) {
      return res.status(404).send({
          "success": false,
          "status": 404,
          "message": "Album data not found",
      });
  } 
  let isError = 0
  let updateData = {};
  let willWeUpdate = 0; // 1 = yes , 0 = no;
  
  
  
    // check artist name empty or not and check length
    if(existingDataById[0].title !== reqData.title){

        // check album title empty or not and check length
        if(isEmpty(reqData.title)){
            return res.status(400).send({
              "success": false,
              "status": 400,
              "message":"Album title cannot be empty."
            });
        }else if(reqData.title.length > 50){
            return res.status(400).send({
              "success": false,
              "status": 400,
              "message":"Album title should be maximum 50 character."
            });
        }
    
        // title existing database
        let existingTitle = await albumModel.getByTitle(reqData.title)
        if(!isEmpty(existingTitle)){
            return res.status(409).send({
                "success": false,
                "status": 409,
                "message":"This title already exists."
              });
        }
    
  
    willWeUpdate = 1
    updateData.title = reqData.title
  
    }
  
  
    // check date of birth is equal to today to tomorrow
    if(existingDataById[0].release_year !== reqData.release_year){
       // check valid release year
    if(isEmpty(reqData.release_year)){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Album release year cannot be empty."
        });
    }else if(reqData.release_year < 1){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Please give positive number."
        });
    }else if(reqData.release_year > current_date.getFullYear()){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Please give valid year witch is equal this year or less than."
        });
    }


    willWeUpdate = 1
    updateData.release_year = reqData.release_year
      
    } 

    if(existingDataById[0].genre_id !== reqData.genre_id){

        // genre validation
        if(isEmpty(reqData.genre_id)){
            return res.status(400).send({
                "success": false,
                "status": 400,
                "message":"Genre id cannot be empty."
            });
        }else if(reqData.genre_id < 1){
            return res.status(400).send({
            "success": false,
            "status": 400,
            "message":"Please give positive number."
            });
        }

        // check existing genre id in db
        let existingByGenreId = await genreModel.getById(reqData.genre_id)
        if(isEmpty(existingByGenreId)){
            return res.status(404).send({
                "success": false,
                "status": 404,
                "message": "This genre id not found."
            });
        }

        willWeUpdate = 1
        updateData.genre_id = reqData.genre_id
    }

  
    if (isError == 1) {
      return res.status(400).send({
          "success": false,
          "status": 400,
          "message": errorMessage
      });
  }
  
  if (willWeUpdate == 1) {
  
    updateData.updated_at = current_time
  
    let result = await artistModel.updateById(reqData.id,updateData);
  
  
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
        "message": "Artist successfully updated."
    });
  
  
  } else {
    return res.status(200).send({
        "success": true,
        "status": 200,
        "message": "Nothing to update."
    });
  }
  

   
});
  



// check duplicate value function
let duplicateCheckInArray = async (arrayData = []) => {
    let set = new Set();
  
    for (let element of arrayData) {
      if (set.has(element)) {
        return {
          result: true,
          message: "Duplicate value found.",
        };
      }
      set.add(element);
    }
  
    return {
      result: false,
      message: "Duplicate value not found.",
    };
  };

module.exports = router;  