const orderModel = require('../models/orderModel');

const kafkaProducer = require('./orderKafkaHandler');

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
exports.createOrder = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    orderModel.createOrder(req.user.id, req.body.sum, req.body.name, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            const orderRow = result.rows[0];
            kafkaProducer.sendEventOrderStatusChanged(orderRow.Id, orderRow.Number, orderRow.Status, orderRow.UserId, orderRow.Sum);
            res.status(201).json(result.rows[0]);
        }
    });
};


exports.getOrderByUserAndNum = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    orderModel.getOrderByUserAndNum(req.user.id, req.params.orderNum, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            if (!result.rows || result.rows.length == 0) {
                res.status(404).json({ message: `Order ${req.params.orderNum} not found for current user` });
            } else {
                res.status(200).json(result.rows[0]);    
            }
            
        }
    });
}