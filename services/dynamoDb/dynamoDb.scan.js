const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBClientBase } = require("./dynamoDb.base");

class DynamoDBClientScan extends DynamoDBClientBase
{
    async scan(tableName)
    {
        const input = { 
            TableName: tableName,
            Limit: 1
        };
    
        const command = new ScanCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { DynamoDBClientScan }