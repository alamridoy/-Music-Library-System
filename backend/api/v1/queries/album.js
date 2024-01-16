let table_name = "m360ict_albums";



let addNew = () => {
    return `INSERT INTO ${table_name} SET ?`;
}

let getByTitle = () => {
    return `SELECT * FROM ${table_name} where  title = ? and status != 0`;
}

let getList = () => {
    return `SELECT * FROM ${table_name}  where status = 1`;
}

let getById = () => {
    return `SELECT * FROM ${table_name} where  id = ? and status = 1 `;
}

const updateById = () => {
    return `UPDATE ${table_name} SET ? WHERE id = ?`;
}

module.exports = {
    addNew,
    getByTitle,
    getList,
    getById,
    updateById

}