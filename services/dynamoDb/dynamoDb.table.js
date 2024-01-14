const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBClientBase } = require("./dynamoDb.base");

class DynamoDBClientTable extends DynamoDBClientBase
{
    async getTable(tableName)
    {
        const input = { 
            TableName: tableName
        };
    
        const command = new DescribeTableCommand(input);
        const response = await this.client.send(command);

        return response.Table;
    }
}

module.exports = { DynamoDBClientTable }