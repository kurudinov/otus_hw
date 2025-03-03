const profileModel = require('../models/profileModel');

exports.getCurrentUserProfile = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }

    profileModel.getProfileByUserId(req.user.id, (err, result) => {
        if (err) {
            next(err)
        }
        else {
            if (result.rows && result.rows[0]) {
                const row = result.rows[0];
                res.status(200).json({
                    id: row.UserId,
                    age: row.Age,
                    sex: row.Sex,
                    avatarUri: row.AvatarUri
                });
            } else {
                const profile = {
                    userId: req.user.id,
                    age: 0,
                    sex: "",
                    avatarUri: ""
                };

                profileModel.createOrUpdateProfile(profile, (err, result) => {
                    if (err) {
                        next(err)
                    }
                    else {
                        res.status(200).json(profile);
                    }
                });
            }
        }
    });
};

exports.updateCurrentUserProfile = function (req, res, next) {
    if (!req.user || !req.user.id) {
        res.status(401).json({ message: "Not authorized. User context not provided" });
        return;
    }
    const profile = {
        userId: req.user.id,
        age: req.body.age,
        sex: req.body.sex,
        avatarUri: req.body.avatarUri
    };

    profileModel.createOrUpdateProfile(profile, (err, result) => {
        if (err) {
            next(err);
        }
        else {
            res.status(200).json(profile);
        }
    });
};

