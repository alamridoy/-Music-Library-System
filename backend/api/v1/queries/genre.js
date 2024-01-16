let table_name = "m360ict_genres";

let getById = () => {
    return `SELECT * FROM ${table_name} where  id = ? and status = 1 `;
}

module.exports = {
   
    getById,

}