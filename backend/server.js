const express = require("express");
const cors = require('cors');
const app = express();
// const fileUpload = require('express-fileupload')



// // middleware
// app.use(fileUpload())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());




const api_redirect_path = require("./api/api");
const port = process.env.PORT || 3003;
const api_version = 1.0;



app.use('/api', api_redirect_path);
app.listen(port, async () => {
    console.log(`Music Library System backend running port ${port}`);
});
