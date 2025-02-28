// notifHttpController.js
 
const notifModel = require('../models/notifModel');


// get user notifications
exports.getUserNotifications = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    notifModel.getNotificationsForUser(req.user.id, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            res.status(200).json(result.rows);
        }
    });
};

exports.getUserOrderNotifications = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    if (!req.params.orderNumber) {
        res.status(400).json({ message: "Order Number not provided" });
        return;
    }

    notifModel.getNotificationsForUserOrder(req.user.id, req.params.orderNumber, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            res.status(200).json(result.rows);
        }
    });
};
