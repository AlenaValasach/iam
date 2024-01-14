const { AWS_CONFIG } = require('../../aws.config');
const { LambdaClient } = require("@aws-sdk/client-lambda");

class LambdaClientBase
{
    constructor()
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
        let region = AWS_CONFIG.region;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client=  new LambdaClient(credentials);
    }
}

module.exports = { LambdaClientBase }