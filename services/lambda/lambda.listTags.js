const { LambdaClient, ListEventSourceMappingsCommand, ListTagsCommand } = require("@aws-sdk/client-lambda");
const { LambdaClientBase } = require("./lambda.base");

class LambdaClientListTags extends LambdaClientBase
{
    async getListTags(lambdaFunctionArn)
    {
        const input = { 
            Resource: lambdaFunctionArn
          };
    
        const command = new ListTagsCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { LambdaClientListTags }