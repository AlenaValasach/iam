const dotenv = require('dotenv');
dotenv.config();

const AWS_CONFIG = {
    "accessKeyId": process.env.ACCESS_KEY_ID,
    "secretAccessKey": process.env.ACCESS_SECRET_ID,
    "accountId": process.env.ACCOUNT_ID,
    "region": process.env.REGION
}

module.exports = { AWS_CONFIG }
