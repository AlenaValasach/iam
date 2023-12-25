const dotenv = require('dotenv');
dotenv.config();

const RDS_DB_CONFIG = {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "dbName": process.env.DB_NAME,
    "dbPort": process.env.DB_PORT,
}

module.exports = { RDS_DB_CONFIG }