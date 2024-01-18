let table_name = "m360ict_artists";



let addNew = () => {
    return `INSERT INTO ${table_name} SET ?`;
}

let getByName = () => {
    return `SELECT * FROM ${table_name} where  name = ? and status != 0`;
}


let getList = () => {
    return `SELECT * FROM ${table_name}  where status = 1`;
}

let getById = () => {
    return `SELECT id,name,date_of_birth FROM ${table_name} where  id = ? and status = 1 `;
}

const updateById = () => {
    return `UPDATE ${table_name} SET ? WHERE id = ?`;
}

let getAlbumListByArtistId = () => {
    return `SELECT id,title,release_year FROM m360ict_albums where id in (SELECT album_id FROM m360ict_album_wise_artists where artist_id = ? and status = 1) and status = 1;`;
}
let getArtistListByAlbumId = () => {
    return `SELECT id,name,date_of_birth FROM m360ict_artists where id in (SELECT artist_id FROM m360ict_album_wise_artists where album_id = ? and status = 1) and status = 1;`;
}


module.exports = {
    addNew,
    getByName,
    getList,
    getById,
    updateById,
    getAlbumListByArtistId,
    getArtistListByAlbumId

}