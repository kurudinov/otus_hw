// erpModel.js

const db = require('../config/db');
//const uuid = require('uuid');

const PRODUCTS_TABLE = '"erp"."Products"';
const RESERV_TABLE = '"erp"."Reservations"';

exports.getAllProducts = async function (callback) {
    db.query(`SELECT "Code", "Name", "Price", "Stock" FROM ${PRODUCTS_TABLE} ORDER BY "Code"`, callback);
};

exports.createReservation = async function (orderNumber, productCode, quantity) {

    try {
        await db.query('BEGIN;'); // ISOLATION LEVEL Serializable // REPEATABLE READ etc.

        // check if enough balance
        const result = await db.query(`SELECT "Stock" FROM ${PRODUCTS_TABLE} WHERE "Code" = $1 FOR UPDATE;`, // NOWAIT SKIP LOCKED etc.
            [productCode]);
        const stock = parseInt(result.rows[0].Stock);
        if (stock < quantity) {
            await db.query('ROLLBACK');
            return 'NOT_ENOUGH_STOCK';
        }
        const newStock = stock - parseInt(quantity);

        await db.query(`INSERT INTO ${RESERV_TABLE} ("OrderNumber", "ProductCode", "Quantity", "CreatedAt", "Status") 
         VALUES($1, $2, $3, NOW(), 'RESERVED');`,
            [orderNumber, productCode, quantity]);

        await db.query(`UPDATE ${PRODUCTS_TABLE}
            SET "Stock" = $2 WHERE "Code" = $1`,
            [productCode, newStock]);

        await db.query('COMMIT');

        return 'SUCCESS';

    } catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [createReservation] for order ${orderNumber}`, e);
        await db.query('ROLLBACK');

        throw(e);
    }

    
};

exports.cancelReservation = async function (orderNumber) {

    try {
        await db.query('BEGIN;'); // ISOLATION LEVEL Serializable // REPEATABLE READ etc.

        // get reservation
        const result = await db.query(`SELECT "Number", "Quantity", "ProductCode" FROM ${RESERV_TABLE} 
            WHERE "OrderNumber" = $1 AND "Status" = 'RESERVED' FOR UPDATE;`, // NOWAIT SKIP LOCKED etc.
            [orderNumber]);
        //const resNumber = result.rows[0].Number;
        const quantity = parseInt(result.rows[0].Quantity);
        const productCode = result.rows[0].ProductCode;

        const res = await db.query(`SELECT "Stock" FROM ${PRODUCTS_TABLE} WHERE "Code" = $1 FOR UPDATE;`, // NOWAIT SKIP LOCKED etc.
            [productCode]);
        const stock = parseInt(res.rows[0].Stock);

        await db.query(`UPDATE ${RESERV_TABLE}
            SET "Status" = 'CANCEL' WHERE "OrderNumber" = $1`,
            [orderNumber]);

        newStock = stock + quantity;
        
        await db.query(`UPDATE ${PRODUCTS_TABLE}
            SET "Stock" = $2 WHERE "Code" = $1`,
            [productCode, newStock]);

        await db.query('COMMIT');

        return 'SUCCESS';

    } catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [createReservation] for order ${orderNumber}`, e);
        await db.query('ROLLBACK');

        throw(e);
    }

    
};

exports.getProductInfo = async function (productCode, callback) {
    db.query(`SELECT "Code", "Name", "Price", "Stock" FROM ${PRODUCTS_TABLE} WHERE "Code" = $1`, [productCode], callback);
};
