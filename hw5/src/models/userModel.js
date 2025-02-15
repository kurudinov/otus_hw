const db = require('../config/db');


const USERS_TABLE = "my_users";

exports.getAllUsers = function(callback) {
    db.query(`SELECT * FROM ${USERS_TABLE}`, callback);
};

exports.getUserById = function(id, callback) {
    db.query(`SELECT * FROM ${USERS_TABLE} WHERE id = $1`, [id], callback);
};

exports.createUser = function(newUser, callback) {
    db.query(`INSERT INTO ${USERS_TABLE} (id, FirstName, LastName, Email) VALUES ($1, $2, $3, $4)`, 
        [newUser.id, newUser.firstName, newUser.lastName, newUser.email], callback);
};

exports.updateUser = function(id, user, callback) {
    db.query(`
        UPDATE ${USERS_TABLE} SET 
            Email = COALESCE($2, Email), 
            FirstName = COALESCE($3,FirstName), 
            LastName = COALESCE($4, LastName) 
        WHERE id = $1`, 
        [id, user.email, user.firstName, user.lastName,], 
        callback);
};

exports.deleteUser = function(id, callback) {
    db.query(`DELETE FROM ${USERS_TABLE} WHERE id = $1 RETURNING *`, [id], callback);
};