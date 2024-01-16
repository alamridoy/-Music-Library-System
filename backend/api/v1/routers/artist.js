const express = require("express");
const isEmpty = require("is-empty");
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken')
const {check,validationResult} = require('express-validator')
const moment = require("moment");
const artistModel = require('../models/artist');





// create artist 
router.post('/add', verifyToken, [
    // Example body validations
    check('name').isString().withMessage('Please provide a string'),
    check('date_of_birth').isDate().withMessage('Please give a valid date.')
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
        "name": req.body.name,
        "date_of_birth":req.body.date_of_birth,
   }

    let current_date = new Date(); 
    let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    reqData.created_at = current_time;
    reqData.updated_at = current_time;

    // reqData.created_by = req.decoded.userInfo.id;
    // reqData.updated_by = req.decoded.userInfo.id;


    // check artist name empty or not and check length
    if(isEmpty(reqData.name)){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Artist cannot be empty."
        });
    }else if(reqData.name.length > 50){
        return res.status(400).send({
          "success": false,
          "status": 400,
          "message":"Artist name should be maximum 50 character."
        });
    }

    // existing artist in database
      // title existing database
      let existingName = await artistModel.getByName(reqData.name)
      if(!isEmpty(existingName)){
          return res.status(409).send({
              "success": false,
              "status": 409,
              "message":"This artist name already exists."
            });
      }



    // check date of birth is equal to today to tomorrow
    let date = moment(current_date, "YYYY-MM-DD").format("YYYY-MM-DD");
 
    if (reqData.date_of_birth >= date) {
      return res.status(400).send({
          "success": false,
          "status": 400,
          "message": "Date of birth should be less than today."
      });
  }
    
    // save in database
    let result = await artistModel.addNew(reqData);

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
      "message": "Artist added Successfully."
  });
   

    return res.status(409).send({
        "success": false,
        "status": 409,
        "message":reqData
   });
        

    
    } catch (error) {
      

      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
});


// list 
router.get('/list', verifyToken, async (req, res) => {

  let result = await artistModel.getList();

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
    let result = await artistModel.getById(id);

    // check this id already existing in database or not
    if (isEmpty(result)) {
      return res.status(404).send({
        success: false,
        status: 404,
        message: "Artist data not found."
      });

    } 


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
  let existingById = await artistModel.getById(id);

  // check this id already existing in database or not
  if (isEmpty(existingById)) {
    return res.status(404).send({
      success: false,
      status: 404,
      message: "Artist data not found."
    });

  } 

  let current_date = new Date(); 
  let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");

  let data = {
    status : 0,   // status = 1 (active) and status = 2 (delete)
    updated_at :current_time
   }

    // get id wise data form db 
    let result = await artistModel.updateById(id,data);

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
         "message": "Artist successfully deleted."
     });
  

});

  

//update
router.put('/update', verifyToken, [
  // Example body validations
  check('id').isInt().withMessage('Please provide a number'),
  check('name').isString().withMessage('Please provide a string'),
  check('date_of_birth').isDate().withMessage('Please give a valid date.')
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
      "name": req.body.name,
      "date_of_birth":req.body.date_of_birth,
 }

  let current_date = new Date(); 
  let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
  reqData.updated_at = current_time;

  // reqData.created_by = req.decoded.userInfo.id;
  // reqData.updated_by = req.decoded.userInfo.id;
   
  // get artist all info
  let existingDataById = await artistModel.getById(reqData.id)
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



  // check artist name empty or not and check length
  if(existingDataById[0].name !== reqData.name){
    if(isEmpty(reqData.name)){
      return res.status(400).send({
        "success": false,
        "status": 400,
        "message":"Artist cannot be empty."
      });
  }else if(reqData.name.length > 50){
      return res.status(400).send({
        "success": false,
        "status": 400,
        "message":"Artist name should be maximum 50 character."
      });
  }

  willWeUpdate = 1
  updateData.name = reqData.name

  }


  // check date of birth is equal to today to tomorrow
  if(existingDataById[0].date_of_birth !== reqData.date_of_birth){
    let date = moment(current_date, "YYYY-MM-DD").format("YYYY-MM-DD");
    console.log(date)
    if (reqData.date_of_birth >= date) {
      return res.status(400).send({
          "success": false,
          "status": 400,
          "message": "Date of birth should be less than today."
      });
  }
  willWeUpdate = 1
  updateData.date_of_birth = reqData.date_of_birth
    
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



module.exports = router;  