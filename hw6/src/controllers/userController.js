const UserModel = require('../models/userModel');

const ADMIN_ROLE = "admin";

exports.getAllUsers = function (req, res, next) {
    const userRoles = req.get("X-UserRoles");
    if (userRoles && userRoles.includes(ADMIN_ROLE)) {
        UserModel.getAllUsers((err, result) => {
            if (err) {
                next(err)
            }
            else {
                res.status(200).json(result.rows);
            }
        });
    } else {
        res.status(401).json({ message: "Not authorized. Admin role required"});
    }

};

exports.getUserById = function (req, res, next) {
    const userRoles = req.get("X-UserRoles");
    if (userRoles && userRoles.includes(ADMIN_ROLE)) {
        UserModel.getUserById(req.params.id, (err, result) => {
            if (err) {
                next(err)
            }
            else {
                if (result.rows && result.rows[0]) {
                    res.status(200).json(result.rows[0]);
                } else {
                    res.status(404).json({ message: `User with id '${req.params.id}' not found` });
                }
            }
        });
    } else {
        res.status(401).json({ message: "Not authorized"});
    }
};

exports.updateUser = function (req, res, next) {
    const userRoles = req.get("X-UserRoles");
    if (userRoles && userRoles.includes(ADMIN_ROLE)) {

        const updatedUser = {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName
        };

        UserModel.updateUser(req.params.id, updatedUser, (err, result) => {
            if (err) {
                next(err)
            }
            else {
                if (result.rowCount > 0) {
                    res.status(200).json({ message: 'User updated successfully' });
                } else {
                    res.status(404).json({ message: 'User not found' });
                }
            }
        });
    } else {
        res.status(401).json({ message: "Not authorized"});
    }
};

exports.deleteUser = function (req, res) {
    const userRoles = req.get("X-UserRoles");
    if (userRoles && userRoles.includes(ADMIN_ROLE)) {

        UserModel.deleteUser(req.params.id, (err, result) => {
            if (err) {
                next(err)
            }
            else {
                if (result.rowCount > 0) {
                    res.status(200).json({ message: 'User deleted successfully' });
                } else {
                    res.status(404).json({ message: 'User not found' });
                }

            }
        });
    } else {
        res.status(401).json({ message: "Not authorized"});
    }
};


exports.getCurrentUserProfile = function (req, res, next) {

    const userId = req.get("X-UserId");

    if (userId && userId != "") {
        UserModel.getUserById(userId, (err, result) => {
            if (err) {
                next(err)
            }
            else {
                if (result.rows && result.rows[0]) {
                    const userRow = result.rows[0];
                    res.status(200).json({
                        id: userRow.Id,
                        email: userRow.Email,
                        firstName: userRow.FirstName,
                        lastName: userRow.LastName
                    });
                } else {
                    res.status(404).json({ message: `User with id '${userId}' not found` });
                }
            }
        });
    } else {
        res.status(401).json({ message: "Not authorized"});
    }
};


exports.checkAndUpdateCurrentUserProfile = function (req, res, next) {

    if (!(req.body.email && req.body.firstName && req.body.lastName && req.body.password)) {
        res.status(400).json({ message: `Wrong data provided`});
    }

    console.log(JSON.stringify(req.headers, null, 4));

    const userId = req.get("X-UserId");
    const userEmail = req.get("X-UserEmail");

    if (userId && userId != "" && userEmail && userEmail != "") {

        if (req.body.email && req.body.email != userEmail) {
            UserModel.getUserByEmail(req.body.email, (err, result) => {
                if (err) {
                    next(err)
                }
                else {
                    if (result.rows && result.rows[0]) {
                        res.status(400).json({ message: `Email '${req.body.email}' already taken` });
                    } else {
                        updateCurrentUserProfile(userId, req, res, next);
                    }
                }
            });
        } else {
            updateCurrentUserProfile(userId, req, res, next);
        }

    } else {
        res.status(401).json({ message: "Not authorized. Auth X-headers not provided"});
    }
};


var updateCurrentUserProfile = function (userId, req, res, next) {

    const updatedUser = {
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: req.body.password
    };

    UserModel.updateUser(userId, updatedUser, (err, result) => {
        if (err) {
            next(err)
        }
        else {
            if (result.rowCount > 0) {
                res.status(200).json({ message: 'User updated successfully'});
            } else {
                res.status(404).json({ message: 'User not found'});
            }
        }
    });
};