const db = require('../config/db');


const PROFILE_TABLE = "profile.Profiles";

exports.getAllProfiles = function(callback) {
    db.query(`SELECT * FROM ${PROFILE_TABLE}`, callback);
};

exports.getProfileByUserId = function(id, callback) {
    db.query(`SELECT * FROM ${PROFILE_TABLE} WHERE "UserId" = $1`, [id], callback);
};

exports.createOrUpdateProfile = function(profile, callback) {
    db.query(
        `INSERT INTO ${PROFILE_TABLE} ("UserId", "Age", "Sex", "AvatarUri") 
        VALUES ($1, $2, $3, $4) 
        on conflict ("UserId") do update set 
            "Age" = $2, 
            "Sex" = $3,
            "AvatarUri" = $4`, 
        [profile.userId, profile.age, profile.sex, profile.avatarUri], callback);
};

exports.createProfile = function(profile, callback) {
    db.query(
        `INSERT INTO ${PROFILE_TABLE} ("UserId", "Age", "Sex", "AvatarUri") 
        VALUES ($1, $2, $3, $4)`, 
        [profile.userId, profile.age, profile.sex, profile.avatarUri], callback);
};