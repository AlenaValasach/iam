const { AWS_CONFIG } = require('../../aws.config');
const { CloudWatchClient } = require("@aws-sdk/client-cloudwatch"); 

class CloudWatchClientBase
{
    constructor()
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
        let region = AWS_CONFIG.region;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client=  new CloudWatchClient(credentials);
    }
}

module.exports = { CloudWatchClientBase }