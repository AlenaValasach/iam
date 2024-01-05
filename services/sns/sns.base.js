const { AWS_CONFIG } = require('../../aws.config');
const { SNSClient } = require("@aws-sdk/client-sns");

class SNSClientBase
{
    constructor()
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
        let region = AWS_CONFIG.region;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client=  new SNSClient(credentials);
    }
}

module.exports = { SNSClientBase }