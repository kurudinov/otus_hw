// orderModel.js

//const { default: tr } = require('date-and-time/locale/tr');
const db = require('../config/db');
//const uuid = require('uuid');

const ORDERS_TABLE = '"order"."Orders"';

exports.getOrdersForUser = function (userId, callback) {
    db.query(`SELECT * FROM ${ORDERS_TABLE}
        WHERE "UserId" = $1`, [userId], callback);
};

exports.createOrder = async function (userId, sum, name, productCode, productName, quantity, deliveryDate, address, clientRequestId, callback) {

    try {
        const res1 = await db.query(`SELECT * FROM ${ORDERS_TABLE} WHERE "ClientRequestId" = $1 AND "UserId" = $2`, [clientRequestId, userId]);
        if (res1.rows && res1.rows.length > 0) {
            db.query(`SELECT *  FROM ${ORDERS_TABLE}
                WHERE "ClientRequestId" = $1 AND "UserId" = $2`, [clientRequestId, userId], callback);
        } else {
            db.query(`INSERT INTO ${ORDERS_TABLE} ("UserId", "Sum", "Name", "ProductCode", "ProductName", "Quantity", "DeliveryDate", "Address", "Status", "CreatedAt", "ClientRequestId") 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CREATED', NOW(), $9) RETURNING "Number"`, 
                [userId, sum, name, productCode, productName, quantity, deliveryDate, address, clientRequestId], (err, result) => {
                if (err) {
                    callback(err);
                } else {
                    db.query(`SELECT *  FROM ${ORDERS_TABLE}
                    WHERE "Number" = $1`, [result.rows[0].Number], callback);
                }
            });
        }
    } catch (err) {
        callback(err);
    }

};

exports.updateOrderStatus = async function (orderNumber, status, callback) {
    try {
        await db.query(`UPDATE ${ORDERS_TABLE} 
            SET "Status" = $2, "UpdatedAt" = NOW() 
            WHERE "Number" = $1`, [orderNumber, status]);

        return db.query(`SELECT * FROM ${ORDERS_TABLE}
            WHERE "Number" = $1`, [orderNumber]);
    }
    catch (e) {
        console.error(`[paymentResultHandler] ${e.message}`, e);
        callback(e);
    }

};


/***
    get Order Row from DB
***/
exports.getOrderDetails = async function (orderNumber) {

    let res = await db.query(`SELECT * FROM ${ORDERS_TABLE}
            WHERE "Number" = $1`, [orderNumber]);
    return res.rows[0];
};


exports.getOrderByUserAndNum = async function (userId, orderNumber, callback) {
    db.query(`SELECT * FROM ${ORDERS_TABLE}
        WHERE "UserId" = $1 and "Number" = $2`, [userId, orderNumber], callback);
};