const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { AWS_CONFIG } = require('../../aws.config');

class DynamoDBClientBase
{
    constructor()
    {
        let accessKeyId = AWS_CONFIG.accessKeyId;
        let secretAccessKey = AWS_CONFIG.secretAccessKey;
        let region = AWS_CONFIG.region;
    
        const credentials = { accessKeyId, secretAccessKey, region };
    
        this.client=  new DynamoDBClient(credentials);
    }
}

module.exports = { DynamoDBClientBase }