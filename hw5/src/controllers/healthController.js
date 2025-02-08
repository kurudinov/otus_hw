exports.getStatus = function (req, res, next) {
    res.status(200).json({ status: `OK` });
};