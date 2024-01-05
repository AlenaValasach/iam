const { SQSClient } = require('@aws-sdk/client-sqs');
const { AWS_CONFIG } = require('../../aws.config');

class SQSClientBase
{
    constructor()
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
        let region = AWS_CONFIG.region;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client=  new SQSClient(credentials);
    }
}

module.exports = { SQSClientBase }