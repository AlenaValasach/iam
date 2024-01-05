const { EC2Client } = require("@aws-sdk/client-ec2");
const { GMAIL_CONFIG } = require('../gmail.config');

const axios = require('axios');
const base64 = require('js-base64');

class GmailService
{
    async getLatestMessage()
    {
        const accessToken = GMAIL_CONFIG.access_token;
        const serverUrl = GMAIL_CONFIG.url;
        const email = GMAIL_CONFIG.email

        let url = `${serverUrl}/users/${email}/messages`;
        let config = {
              method: "get",
              url: url,
              headers: {
                Authorization: `Bearer ${accessToken} `,
                "Content-type": "application/json",
              },
              params: 
              { "maxResults": 200 } 
        };
    
        let response = await axios(config);
        let data = response.data;
        let message = data.messages[0];

        return message;
    }

    async getMessageDetails(messageId)
    {
        const accessToken = GMAIL_CONFIG.access_token;
        const serverUrl = GMAIL_CONFIG.url;
        const email = GMAIL_CONFIG.email

        let url = `${serverUrl}/users/${email}/messages/${messageId}`;
        let config = {
              method: "get",
              url: url,
              headers: {
                Authorization: `Bearer ${accessToken} `,
                "Content-type": "application/json",
              }
        };
    
        let response = await axios(config);
        let data = response.data;

        let subject = data.payload.headers.find(x => x.name === "Subject").value;

        let body = base64.decode(data.payload.body.data);

        return data;
    }
}

module.exports = { GmailService }