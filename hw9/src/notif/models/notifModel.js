// notifModel.js

const db = require('../config/db');
const uuid = require('uuid');

const NOTIF_TABLE = '"notif"."Notifications"';


// returns all notifications for user
exports.getNotificationsForUser = function (userId, callback) {
    db.query(`SELECT "Id", "Text", "UserId", "OrderNumber", "Timestamp", "IsRead" FROM ${NOTIF_TABLE} WHERE "UserId" = $1 ORDER BY "Timestamp"`, [userId], callback);
};


// returns all notifications for order
exports.getNotificationsForUserOrder = function (userId, orderNumber, callback) {
    db.query(`SELECT "Id", "Text", "UserId", "OrderNumber", "Timestamp", "IsRead" FROM ${NOTIF_TABLE} WHERE "UserId" = $1  and "OrderNumber" = $2 ORDER BY "Timestamp"`, [userId, orderNumber], callback);
};

// add new notification
exports.addNotification = async function (userId, text, orderNumber, timestamp, callback) {
    db.query(`INSERT INTO ${NOTIF_TABLE} ("Id", "Text", "UserId", "OrderNumber", "Timestamp") 
        VALUES($1, $2, $3, $4, $5)`, [uuid.v4(), text, userId, orderNumber, new Date(timestamp*1000)], callback);
};