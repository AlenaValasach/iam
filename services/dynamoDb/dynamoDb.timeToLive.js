const { DynamoDBClient, DescribeTableCommand, DescribeTimeToLiveCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBClientBase } = require("./dynamoDb.base");

class DynamoDBClientTimeToLive extends DynamoDBClientBase
{
    async getTimeToLive(tableName)
    {
        const input = { 
            TableName: tableName
        };
    
        const command = new DescribeTimeToLiveCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { DynamoDBClientTimeToLive }