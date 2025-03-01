const userModel = require('../models/userModel');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

const kafkaController = require('./authKafkaProducer');

// env
const tokenKey = process.env.JWT_SECRET_KEY;
const tokenTtl = process.env.JWT_TTL || 6000;

// register new user
exports.registerUser = function (req, res, next) {
    userModel.getUserByEmail(req.body.email, (err, result) => {
        if (err) {
            next(err)
        }
        else {
            if (result.rows && result.rows[0]) {
                res.status(400).json({ message: `User already exists with email '${req.body.email}'` });
            } else {
                createBasicUser(uuid.v4(), req, res, next);
            }
        }
    });
};

// create user in the database
var createBasicUser = function (userId, req, res, next) {
    const newUser = {
        id: userId,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        roles: "user"
    };

    userModel.createUser(newUser, (err, result) => {
        if (err) {
            next(err)
        } else {
            kafkaController.sendEventUserRegistered(newUser);

            res.status(201).json({ message: `User added successfully`, id: `${newUser.id}` });
        }
    });
};

// check login and create token
exports.getToken = function (req, res, next) {
    userModel.getUserByEmailAndPassword(req.body.login, req.body.password, (err, result) => {
        if (err) {
            next(err)
        } else {
            if (result.rows && result.rows[0]) {
                const userRow = result.rows[0];
                const token = jwt.sign(
                    {
                        id: userRow.Id,
                        email: userRow.Email,
                        roles: userRow.Roles
                    },
                    tokenKey, { expiresIn: tokenTtl });

                res
                    .status(200)
                    .cookie("access_token", token, { httpOnly: true })
                    .json({ access_token: token });
            } else {
                res.status(401).json({ message: `Wrong login or password` });
            }
        }
    });
};

// logout and clear token cookie
exports.logout = function (req, res, next) {
    return res
        .clearCookie("access_token")
        .status(200)
        .json({ message: "Successfully logged out" });
};
