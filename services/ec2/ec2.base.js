const { EC2Client } = require("@aws-sdk/client-ec2");
const { AWS_CONFIG } = require('../../aws.config');

class EC2ClientBase
{
    constructor()
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
        let region = AWS_CONFIG.region;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client=  new EC2Client(credentials);
    }
}

module.exports = { EC2ClientBase }