const erpModel = require('../models/erpModel');

// get products, stock and price
exports.getProducts = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    erpModel.getAllProducts( (err, result) => {
        if (err) {
            next(err);
        }
        else {
            res.status(200).json(result.rows);
        }
    });
};

// calc price for product (internal, no authorization)
exports.calcPrice = function (req, res, next) {

    erpModel.getProductInfo(req.body.productCode, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            res.status(200).json(result.rows[0]);
        }
    });
};