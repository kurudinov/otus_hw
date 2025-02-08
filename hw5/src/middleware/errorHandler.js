// not used yet

module.exports = function errorHandler(err, req, res, next) {
    console.error(err.stack);
    //res.status(500).render('error', { error: err })
    res.status(500).send('Something broke! ' + err.stack);
};