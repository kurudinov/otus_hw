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

// оплата заказа - списание денег со счета
exports.payForOrder = async function (userId, amount, orderNumber, callback) {

    try {
        await db.query('BEGIN;'); // ISOLATION LEVEL Serializable // REPEATABLE READ etc.

        // check if already payed
        const resPay = await db.query(`SELECT "OrderNumber" FROM ${ORDER_PAYMENT_TABLE} WHERE "OrderNumber" = $1;`, [orderNumber]);
        if (resPay.rows.length > 0) {
            return callback(null, 'ALREADY_PAID');

        }

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
            [uuid.v4(), userId, -amount, balance, newBalance, `Order ${orderNumber} paid`]);

        await db.query(`UPDATE ${WALLET_TABLE}
            SET "Balance" = $2 WHERE "UserId" = $1`,
            [userId, newBalance]);

        // set payment record
        await db.query(`INSERT INTO ${ORDER_PAYMENT_TABLE} ("OrderNumber", "Timestamp", "Status") 
                VALUES($1, NOW(), 'PAIED')`, [orderNumber]);

        await db.query('COMMIT');

        return callback(null, 'SUCCESS');

    } catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [payment order db transaction] order ${orderNumber}`, e);
        await db.query('ROLLBACK');

        callback(e);
    }
};

// возврат зенег за отмененный заказ
exports.returnMoneyForOrder = async function (userId, amount, orderNumber, callback) {

    try {
        await db.query('BEGIN;'); // ISOLATION LEVEL Serializable // REPEATABLE READ etc.

        // есть ли оплаченный заказ c таким Id
        const resPay = await db.query(`SELECT "OrderNumber" FROM ${ORDER_PAYMENT_TABLE} 
            WHERE "OrderNumber" = $1 AND "Status" = 'PAIED';`, [orderNumber]);
        if (resPay.rows.length = 0) {
            // если не нашли, то возвращать деньги не надо
            return callback(null, 'ORDER_NOT_PAIED');
        }

        // текущий баланс
        const result = await db.query(`SELECT "Balance" FROM ${WALLET_TABLE} WHERE "UserId" = $1;`, // SKIP LOCKED etc.
            [userId]);
        const balance = parseFloat(result.rows[0].Balance);
        
        const newBalance = balance + amount;

        // сохраняем проводку
        await db.query(`INSERT INTO ${TRANS_TABLE} ("Id", "UserId", "Amount", "OldBalance", "NewBalance", "Info", "Timestamp") 
         VALUES($1, $2, $3, $4, $5, $6, NOW());`,
            [uuid.v4(), userId, amount, balance, newBalance, `Money return for order ${orderNumber}`]);

        // обновляем баланс
        await db.query(`UPDATE ${WALLET_TABLE}
            SET "Balance" = $2 WHERE "UserId" = $1`,
            [userId, newBalance]);

        // сохраняем запись о возврате заказа
        await db.query(`UPDATE ${ORDER_PAYMENT_TABLE} SET "Status" = 'RETURN' WHERE "OrderNumber" = $1`, [orderNumber]);

        await db.query('COMMIT');

        return callback(null, 'SUCCESS');

    } catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [returnMoneyForOrder] order ${orderNumber}`, e);
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


