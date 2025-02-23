// notifModel.js

const db = require('../config/db');
const uuid = require('uuid');

const NOTIF_TABLE = '"notif"."Notifications"';


// returns all notifications for user
exports.getNotificationsForUser = function (userId, callback) {
    db.query(`SELECT "Id", "Text", "UserId", "Timestamp", "IsRead" FROM ${NOTIF_TABLE} WHERE "UserId" = $1 ORDER BY "Timestamp"`, [userId], callback);
};

// add new notification
exports.addNotification = async function (userId, text, callback) {
    db.query(`INSERT INTO ${NOTIF_TABLE} ("Id", "Text", "UserId", "Timestamp") VALUES($1, $2, $3, NOW())`, [uuid.v4(), text, userId], callback);
};