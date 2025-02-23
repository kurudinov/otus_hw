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
