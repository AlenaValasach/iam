const { CloudTrailClient } = require('@aws-sdk/client-cloudtrail');
const { AWS_CONFIG } = require('../../aws.config');

class CloudTrailClientBase
{
    constructor()
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
        let region = AWS_CONFIG.region;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client=  new CloudTrailClient(credentials);
    }
}

module.exports = { CloudTrailClientBase }