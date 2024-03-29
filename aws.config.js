const dotenv = require('dotenv');
dotenv.config();

const AWS_CONFIG = {
    "accessKeyId": process.env.ACCESS_KEY_ID,
    "secretAccessKey": process.env.ACCESS_SECRET_ID,
    "accountId": process.env.ACCOUNT_ID,
    "region": process.env.REGION,
    "region2": process.env.REGION2
}

module.exports = { AWS_CONFIG }
