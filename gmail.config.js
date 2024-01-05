const dotenv = require('dotenv');
dotenv.config();

const GMAIL_CONFIG = {
    "access_token": process.env.GMAIL_ACCESS_TOKEN,
    "url": "https://gmail.googleapis.com/gmail/v1",
    "email": process.env.GMAIL_EMAIL
}

module.exports = { GMAIL_CONFIG }