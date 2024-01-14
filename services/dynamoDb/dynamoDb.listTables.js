const { ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBClientBase } = require("./dynamoDb.base");

class DynamoDBClientTables extends DynamoDBClientBase
{
    async getTables()
    {
        const command = new ListTablesCommand({});
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { DynamoDBClientTables }