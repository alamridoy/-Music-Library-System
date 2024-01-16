const { connectionMusicLibrarySystemMYSQL } = require('../connections/connection');
const queries = require('../queries/genre');



let getById = async (id = 0) => {
    return new Promise((resolve, reject) => {
        connectionMusicLibrarySystemMYSQL.query(queries.getById(), [id], (error, result, fields) => {
            if (error) reject(error)
            else resolve(result)
        });
    });
}





module.exports = {

   getById,

  
}