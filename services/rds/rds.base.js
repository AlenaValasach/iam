const { AWS_CONFIG } = require('../../aws.config');
const { RDSClient } = require("@aws-sdk/client-rds");

class RDSClientBase
{
    constructor()
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
        let region = AWS_CONFIG.region;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client = new RDSClient(credentials);
    }
}

module.exports = { RDSClientBase }