const billingModel = require('../models/billingModel');


// get user balance
exports.getUserBalance = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    billingModel.getBalanceForUser(req.user.id, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            // wallet not found
            if (!result.rows || result.rows.length === 0) {

                // create wallet in background
                billingModel.createWallet(req.user.id);

                res.status(200).json({ userId: req.user.id, balance: "0.00" });
            }
            // wallet found
            else {
                res.status(200).json({ userId: req.user.id, balance: result.rows[0].Balance });
            }
        }
    });
};

// top up user wallet
exports.addUserBalance = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    billingModel.addBalanceForUser(req.user.id, req.body.amount, req.body.info, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            res.status(201).json(result.rows[0]);
        }
    });

};

// get user balance
exports.getUserTransactions = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    billingModel.getTransactionsForUser(req.user.id, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            res.status(200).json(result.rows);

            // // no transactions found
            // if (!result.rows || result.rows.length === 0) {

            //     res.status(200).json({ message: `No transactions so far for user '${req.user.id}'` });
            // }
            // else {
            //     res.status(200).json(result.rows);
            // }
        }
    });
};