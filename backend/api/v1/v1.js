const express = require("express");
const router = express.Router();



const { connectionMusicLibrarySystemMYSQL } = require('./connections/connection');
//const { routeAccessChecker } = require('./middlewares/routeAccess');
global.config = require('./jwt/config');
//const verifyToken = require('./middlewares/jwt_verify/verifyToken');
//const moduleModel = require('./models/module');



//const adminRouter = require('./routers/authentication');

const authenticationRouter = require('./routers/authentication');
const artistRouter = require('./routers/artist');


router.use('/authentication', authenticationRouter);
router.use('/artist', artistRouter);


module.exports = router;  