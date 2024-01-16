const { connectionMusicLibrarySystemMYSQL } = require('../connections/connection');
const queries = require('../queries/album');
const albumWiseArtistModel = require('../models/album-wise-artist');
const moment = require("moment");
const isEmpty = require("is-empty");


let addNew = async(albumData = {}, validateArtistId = []) => {
    return new Promise((resolve, reject) => {
        connectionMusicLibrarySystemMYSQL.getConnection(function(err, conn) {
            conn.beginTransaction(async function(error) {
                if (error) {
                    return conn.rollback(function() {
                        conn.release();
                        resolve([]);
                    });
                }
               
                let finalResult;
                
                conn.query(queries.addNew(), [albumData], async(error, result, fields) => {
                  
                    if (error) {
                        console.log("Aaaa",error)
                        return conn.rollback(function() {
                           
                            conn.release();
                           
                            resolve([]);
                        });
                    }
                    
                    finalResult = result;

                    let current_date = new Date(); 
                    let current_time = moment(current_date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
                    created_at = current_time;
                    updated_at = current_time;

                    for (let artistId of validateArtistId) {
                        let albumWiseArtist = {
                            album_id: finalResult.insertId,
                            artist_id: artistId,
                            created_at: created_at,
                            updated_at: updated_at

                        };

                
                        let albumWiseArtistData = await albumWiseArtistModel.addNew(albumWiseArtist, conn);

                        if (isEmpty(albumWiseArtistData) || albumWiseArtistData.affectedRows == undefined || albumWiseArtistData.affectedRows < 1) {
                            return conn.rollback(function() {
                                conn.release();
                                resolve([]);
                            });
                        }
                    }


                    conn.commit(function(err) {
                        if (err) {
                            return conn.rollback(function() {
                                conn.release();
                                resolve([]);
                            });
                        }
                        conn.release();
                        return resolve(finalResult);
                    });
                });
            });
        });
    });
}


let getByTitle = async(title = "") => {
    return new Promise((resolve, reject) => {
        connectionMusicLibrarySystemMYSQL.query(queries.getByTitle(), [title], (error, result, fields) => {
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
   getByTitle,
   getList,
   getById,
   updateById
  
}