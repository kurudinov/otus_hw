// billingModel.js

const db = require('../config/db');
const uuid = require('uuid');

const WALLET_TABLE = "billing.Wallet";
const TRANS_TABLE = "billing.Transactions";
const ORDER_PAYMENT_TABLE = "billing.OrderPayment";

exports.getAllWallets = function (callback) {
    db.query(`SELECT "UserId", "Balance" FROM ${WALLET_TABLE}`, callback);
};

// returns row
exports.getBalanceForUser = function (userId, callback) {
    db.query(`SELECT "UserId", "Balance" FROM ${WALLET_TABLE} WHERE "UserId" = $1`, [userId], callback);
};

// add amount
exports.addBalanceForUser = async function (userId, amount, info, callback) {

    try {
        await db.query('BEGIN');

        const result = await db.query(`SELECT "Balance" FROM ${WALLET_TABLE} WHERE "UserId" = $1 FOR UPDATE`, [userId]);
        const balance = parseFloat(result.rows[0].Balance);

        const newBalance = balance + amount;

        await db.query(`INSERT INTO ${TRANS_TABLE} ("Id", "UserId", "Amount", "OldBalance", "NewBalance", "Info", "Timestamp") 
         VALUES($1, $2, $3, $4, $5, $6, NOW());`,
            [uuid.v4(), userId, amount, balance, newBalance, info]);

        await db.query(`UPDATE ${WALLET_TABLE} SET "Balance" = $2 WHERE "UserId" = $1`,
            [userId, newBalance]);

        await db.query('COMMIT');

        db.query(`SELECT "UserId", "Balance" FROM ${WALLET_TABLE}
            WHERE "UserId" = $1`, [userId], callback);
    } catch (e) {
        await db.query('ROLLBACK')
        callback(e);
    }
};

// add amount
exports.payForOrder = async function (userId, amount, orderId, orderNum, callback) {

    // // check if already payed
    // const resPay = await db.query(`SELECT "OrderId" FROM ${ORDER_PAYMENT_TABLE} WHERE "OrderId" = $1;`, [orderId]);
    // if (resPay.rows.length > 0) {
    //     return callback(null, 'ALREADY_PAID');

    // }

    // // set payment record
    // await db.query(`INSERT INTO ${ORDER_PAYMENT_TABLE} ("OrderId", "OrderNumber", "Timestamp") 
    //             VALUES($1, $2, NOW())`, [orderId, orderNum]);


    try {
        await db.query('BEGIN ISOLATION LEVEL Serializable;'); // ISOLATION LEVEL Serializable // REPEATABLE READ etc.

        // check if enough balance
        const result = await db.query(`SELECT "Balance" FROM ${WALLET_TABLE} WHERE "UserId" = $1 FOR UPDATE SKIP LOCKED;`, // SKIP LOCKED etc.
            [userId]);
        const balance = parseFloat(result.rows[0].Balance);
        if (balance < amount) {
            await db.query('ROLLBACK');
            return callback(null, 'NOT_ENOUGH_BALANCE');
        }
        const newBalance = balance - amount;

        await db.query(`INSERT INTO ${TRANS_TABLE} ("Id", "UserId", "Amount", "OldBalance", "NewBalance", "Info", "Timestamp") 
         VALUES($1, $2, $3, $4, $5, $6, NOW());`,
            [uuid.v4(), userId, -amount, balance, newBalance, `Order ${orderNum} (${orderId}) paid`]);

        await db.query(`UPDATE ${WALLET_TABLE}
            SET "Balance" = $2 WHERE "UserId" = $1`,
            [userId, newBalance]);

        await db.query('COMMIT');

        return callback(null, 'SUCCESS');

    } catch (e) {
        console.error(`ERROR: [payment order db transaction]  order ${orderNum} (${orderId})`, e);
        await db.query('ROLLBACK');

        callback(e);
    }
};


// create wallet with zero amount
exports.createWallet = function (userId, callback) {
    db.query(`INSERT INTO ${WALLET_TABLE} ("UserId", "Balance") VALUES ($1, 0.0)`,
        [userId], callback);
};


exports.getTransactionsForUser = function (userId, callback) {
    db.query(`SELECT "Id", "UserId", "Amount", "OldBalance", "NewBalance", "Info", "Timestamp" FROM ${TRANS_TABLE} WHERE "UserId" = $1 ORDER BY "Timestamp"`, [userId], callback);
};


