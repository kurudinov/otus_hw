const orderModel = require('../models/orderModel');

const kafkaHandler = require('./orderKafkaHandler');

// get user balance
exports.getMyOrders = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    orderModel.getOrdersForUser(req.user.id, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            res.status(200).json(result.rows);
        }
    });
};

// get user balance
exports.createOrder = async function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    try {

        const calcUrl = process.env.ERP_BASEURL + '/erp/calcPrice';
        const calcBody = JSON.stringify({ productCode: req.body.productCode });

        let response = await fetch(calcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: calcBody
        });

        let prodInfo = await response.json();

        let sum = prodInfo.Price * req.body.quantity;

        orderModel.createOrder(req.user.id, sum, req.body.name, req.body.productCode, prodInfo.Name,
            req.body.quantity, req.body.deliveryDate, req.body.address, (err, result) => {
                if (err) {
                    next(err);
                }
                else {
                    const orderRow = result.rows[0];
                    kafkaHandler.sendEventOrderStatusChanged(orderRow.Number, orderRow.Status, orderRow.UserId, orderRow.Sum);
                    kafkaHandler.sendEventPaymentRequest(orderRow.Number, orderRow.UserId, orderRow.Sum);
                    res.status(201).json(result.rows[0]);
                }
            });

    } catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [createOrder]`, e);
        throw (e); 
    }



};


exports.getOrderByUserAndNum = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    orderModel.getOrderByUserAndNum(req.user.id, req.params.orderNumber, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            if (!result.rows || result.rows.length == 0) {
                res.status(404).json({ message: `Order ${req.params.orderNumber} not found for current user` });
            } else {
                res.status(200).json(result.rows[0]);
            }

        }
    });
}