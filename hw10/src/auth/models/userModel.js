const db = require('../config/db');


const USERS_TABLE = '"auth"."Users"';

exports.getAllUsers = function(callback) {
    db.query(`SELECT * FROM ${USERS_TABLE}`, callback);
};

exports.getUserById = function(id, callback) {
    db.query(`SELECT * FROM ${USERS_TABLE} WHERE "Id" = $1`, [id], callback);
};

exports.getUsersCount = function(callback) {
    db.query(`SELECT count(*) as Count FROM ${USERS_TABLE}`, callback);
};

exports.getUserByEmail = function(email, callback) {
    db.query(`SELECT * FROM ${USERS_TABLE} WHERE "Email" = $1`, [email], callback);
};

exports.getUserByEmailAndPassword = function(email, password, callback) {
    db.query(`SELECT * FROM ${USERS_TABLE} WHERE "Email" = $1 AND "Password" = $2`, [email, password], callback);
};

exports.createUser = function(newUser, callback) {
    db.query(`INSERT INTO ${USERS_TABLE} ("Id", "FirstName", "LastName", "Email", "Password", "Roles") VALUES ($1, $2, $3, $4, $5, $6)`, 
        [newUser.id, newUser.firstName, newUser.lastName, newUser.email, newUser.password, newUser.roles], callback);
};

exports.updateUser = function(id, user, callback) {
    db.query(`
        UPDATE ${USERS_TABLE} SET 
            "Email" = COALESCE($2, "Email"), 
            "FirstName" = COALESCE($3, "FirstName"), 
            "LastName" = COALESCE($4, "LastName"),
            "Password" = COALESCE($5, "Password")
        WHERE "Id" = $1`, 
        [id, user.email, user.firstName, user.lastName, user.password], 
        callback);
};

exports.deleteUser = function(id, callback) {
    db.query(`DELETE FROM ${USERS_TABLE} WHERE Id = $1 RETURNING *`, [id], callback);
};