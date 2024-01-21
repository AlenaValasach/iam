const { AWS_CONFIG } = require('../../../aws.config');
const { CloudWatchLogsClient } = require("@aws-sdk/client-cloudwatch-logs");

class CloudWatchLogsClientBase
{
    constructor(region)
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client=  new CloudWatchLogsClient(credentials);
    }
}

module.exports = { CloudWatchLogsClientBase }