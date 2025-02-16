const userModel = require('../models/userModel');
const uuid = require('uuid');
//const userController = require('./userController');
const jwt = require('jsonwebtoken');

const tokenKey = '1a2b-3c4d-5e6f-7g8h';


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
        }
        else {
            res.status(201).json({ message: `User added successfully`, id: `${newUser.id}` });
        }
    });
}

exports.loginAndCreateJWT = function (req, res, next) {
    userModel.getUserByEmailAndPassword(req.body.login, req.body.password, (err, result) => {
        if (err) {
            next(err)
        }
        else {
            if (result.rows && result.rows[0]) {
                const userRow = result.rows[0];
                res.set({
                    'X-UserId': userRow.Id,
                    'X-UserEmail': userRow.Email,
                    'X-UserRoles': userRow.Roles
                });
                res.status(200).json({
                    token: jwt.sign(
                        { id: userRow.Id, 
                            email: userRow.Email,
                            roles: userRow.Roles }, 
                        tokenKey),
                });
            } else {
                res.status(401).json({ message: `Wrong login or password` });
            }
        }
    });
};


exports.validateJWT = function (req, res, next) {
    
    // try{
    //     console.log(new Date().toISOString() + " ValidateJWT\r\nHEADERS: " + JSON.stringify(req.headers, null, 4) + "\r\nBODY: " + JSON.stringify(req.body));
    // } catch {
    //     console.log("ValidateJWT\r\n");
    // }
    

    if (req.headers.authorization) {
        jwt.verify(
            req.headers.authorization.split(' ')[1],
            tokenKey,
            (err, payload) => {
                if (err) {
                    res.status(401).json({ message: `Wrong token` });
                }
                else if (payload) {
                    res.set({
                        'X-UserId': payload.id,
                        'X-UserEmail': payload.email,
                        'X-UserRoles': payload.roles
                    }).status(200).json({ message: `Token verified. Headers were set` });;

                    // userModel.getUserById(payload.id, (err, result) => {
                    //     if (err) {
                    //         res.status(401).json({ message: `Wrong token` });
                    //     } else {
                    //         if (result.rows && result.rows[0]) {
                    //             const userRow = result.rows[0];
                    //             res.set({
                    //                 'X-UserId': userRow.Id,
                    //                 'X-UserEmail': userRow.Email,
                    //                 'X-UserRoles': userRow.Roles
                    //             });
                    //             res.status(200).json({
                    //                 token: jwt.sign({ id: userRow.Id, email: userRow.Email }, tokenKey),
                    //             });
                    //         } else {
                    //             res.status(401).json({ message: `Wrong login or password` });
                    //         }

                    //     }
                    // }
                }
            }
        );
    } else {
        res.status(401).json({ message: `Token was not provided` });
    }
};

