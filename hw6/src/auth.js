const express = require('express');
const authController = require('./controllers/authController');
const healthRoutes = require("./routes/healthRoutes");
const morgan = require("morgan");

const AUTH_PORT = process.env.AUTH_PORT || 8001;



const app = express();
//app.use(morgan("dev"));

morgan.token('req-headers', function (req, res) {
    return JSON.stringify(req.headers)
})
process.env.NODE_ENV != 'prod' && app.use(morgan(':method :url :status :req-headers'));

app.use(express.json());

app.post('/auth/register', authController.registerUser);

app.post('/auth/getToken', authController.loginAndCreateJWT);
app.get('/auth/getToken', authController.loginAndCreateJWT);

app.get('/auth/validateToken', authController.validateJWT);
app.post('/auth/validateToken', authController.validateJWT);

app.use("/health", healthRoutes);


app.use((req, res, next) => {
    authController.validateJWT(req, res, next);
});

app.listen(AUTH_PORT, () => {
    console.log(`Auth server is running on port: ${AUTH_PORT}`);
});