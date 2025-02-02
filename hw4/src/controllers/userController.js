const UserModel = require('../models/userModel');
const uuid = require('uuid');

exports.getAllUsers = function (req, res, next) {
    UserModel.getAllUsers((err, result) => {
        if (err) {
            next(err)
        }
        else {
            res.status(200).json(result.rows)
        }
    });
};

exports.getUserById = function (req, res, next) {
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
};

var createUser = function (userId, req, res, next) {
    const newUser = {
        id: userId,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    };

    UserModel.createUser(newUser, (err, result) => {
        if (err) {
            next(err)
        }
        else {
            res.status(201).json({ message: `User added successfully`, id: `${newUser.id}` });
        }
    });
}

exports.checkIdAndCreateUser = function (req, res, next) {

    if (req.body.id) {
        UserModel.getUserById(req.body.id, (err, result) => {
            if (err) {
                next(err)
            }
            else {
                if (result.rows && result.rows[0]) {
                    res.status(400).json({ message: `User already exists with id '${req.body.id}'` });
                } else {
                    createUser(req.body.id, req, res, next);
                }
            }
        });
    } else {
        createUser(uuid.v4(), req, res, next);
    }




};

exports.updateUser = function (req, res, next) {
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
};

exports.deleteUser = function (req, res) {
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
};