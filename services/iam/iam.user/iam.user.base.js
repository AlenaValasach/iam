const { IAMClient } = require ('@aws-sdk/client-iam');
const { AWS_CONFIG } = require('../../../aws.config');

class IAMBaseUser
{
    constructor()
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
        let region = AWS_CONFIG.region;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client = new IAMClient(credentials);
    }
}

module.exports = { IAMBaseUser }