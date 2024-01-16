const express = require("express");
const router = express.Router();



const { connectionMusicLibrarySystemMYSQL } = require('./connections/connection');
//const { routeAccessChecker } = require('./middlewares/routeAccess');
global.config = require('./jwt/config');
//const verifyToken = require('./middlewares/jwt_verify/verifyToken');
//const moduleModel = require('./models/module');



//const adminRouter = require('./routers/authentication');

const test = require('./routers/authentication');

router.use('/abc', test);


module.exports = router;  