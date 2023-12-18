const { S3Client } = require("@aws-sdk/client-s3");
const { AWS_CONFIG } = require('../../aws.config');

class S3ClientBase
{
    constructor()
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
        let region = AWS_CONFIG.region;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client = new S3Client(credentials);
    }
}

module.exports = { S3ClientBase }