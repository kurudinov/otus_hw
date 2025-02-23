// orderModel.js

//const { default: tr } = require('date-and-time/locale/tr');
const db = require('../config/db');
const uuid = require('uuid');

const ORDERS_TABLE = '"order"."Orders"';

exports.getOrdersForUser = function (userId, callback) {
    db.query(`SELECT "Id", "Number", "UserId", "Sum", "Status", "Name", "CreatedAt", "UpdatedAt" FROM ${ORDERS_TABLE}
        WHERE "UserId" = $1`, [userId], callback);
};

exports.createOrder = function (userId, sum, name, callback) {
    const id = uuid.v4();
    db.query(`INSERT INTO ${ORDERS_TABLE} ("Id", "UserId", "Sum", "Name", "Status", "CreatedAt") 
        VALUES ($1, $2, $3, $4, 'CREATED', NOW())`, [id, userId, sum, name], (err, result) => {
        if (err) {
            callback(err);
        } else {
            db.query(`SELECT "Id", "Number", "UserId", "Sum", "Status", "Name", "CreatedAt", "UpdatedAt" FROM ${ORDERS_TABLE}
                WHERE "Id" = $1`, [id], callback);
        }
    })
};

exports.updateOrderStatus = async function (orderId, status, callback) {
    try{
        await db.query(`UPDATE ${ORDERS_TABLE} 
            SET "Status" = $2, "UpdatedAt" = NOW() 
            WHERE "Id" = $1`, [orderId, status]);

        return db.query(`SELECT "Id", "Number", "UserId", "Sum", "Status", "Name", "CreatedAt", "UpdatedAt" FROM ${ORDERS_TABLE}
            WHERE "Id" = $1`, [orderId]);
    }
    catch (e) {
        console.error(`[paymentResultHandler] ${e.message}`, e);
        callback(e);
    }
    
};



exports.getOrderByUserAndNum = function (userId, orderNum, callback) {
    db.query(`SELECT "Id", "Number", "UserId", "Sum", "Status", "Name", "CreatedAt", "UpdatedAt" FROM ${ORDERS_TABLE}
        WHERE "UserId" = $1 and "Number" = $2`, [userId, orderNum], callback);
};