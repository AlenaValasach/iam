const { DynamoDBClient, ListTagsOfResourceCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBClientBase } = require("./dynamoDb.base");

class DynamoDBClientListTagsOfResource extends DynamoDBClientBase
{
    async getListTagsOfResource(resourceArn)
    {
        const input = { 
            ResourceArn: resourceArn
        };
    
        const command = new ListTagsOfResourceCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { DynamoDBClientListTagsOfResource }