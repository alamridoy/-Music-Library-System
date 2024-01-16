const { connectionMusicLibrarySystemMYSQL } = require('../connections/connection');
const queries = require('../queries/artist');




let addNew = async (info) => {
    return new Promise((resolve, reject) => {
        connectionMusicLibrarySystemMYSQL.query(queries.addNew(), [info], (error, result, fields) => {
            if (error) reject(error)
            else resolve(result)
        });
    });
}

let getList = async () => {
    return new Promise((resolve, reject) => {
        connectionMusicLibrarySystemMYSQL.query(queries.getList(), (error, result, fields) => {
            if (error) reject(error)
            else resolve(result)
        });
    });
}


let getById = async (id = 0) => {
    return new Promise((resolve, reject) => {
        connectionMusicLibrarySystemMYSQL.query(queries.getById(), [id], (error, result, fields) => {
            if (error) reject(error)
            else resolve(result)
        });
    });
}



let updateById = async (id = 0, data = {}) => {
    return new Promise((resolve, reject) => {
        connectionMusicLibrarySystemMYSQL.query(queries.updateById(), [data, id], (error, result, fields) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
}


module.exports = {
   addNew,
   getList,
   getById,
   updateById
  
}