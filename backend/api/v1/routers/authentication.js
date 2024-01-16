const express = require("express");
const router = express.Router();

const isEmpty = require("is-empty");

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require("moment");


router.get('/test',async(req,res)=>{
    res.send("Hello xzsx!!!!!!!")
})


router.post('/registration',async(req,res)=>{


    let reqData = {
        "email": req.body.email,
        "password":req.body.password,
    }

    // reqData.created_by = req.decoded.userInfo.id;


    let current_date = new Date(); 
    let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    reqData.created_at = current_time;
    reqData.updated_at = current_time;

    if(isEmpty(reqData.email)){
        return res.status(400).send({
            "success": false,
            "status": 400,
            "message": "Email can't be empty."
    
        });
    }
   
    return res.status(400).send({
        "success": false,
        "status": 400,
        "message": reqData

    });


})



module.exports = router;  