const { LambdaClient, ListEventSourceMappingsCommand } = require("@aws-sdk/client-lambda");
const { LambdaClientBase } = require("./lambda.base");

class LambdaClientListEventSourceMappings extends LambdaClientBase
{
    async getListEventSourceMappings(lambdaFunctionName)
    {
        const input = { 
            FunctionName: lambdaFunctionName
          };
    
        const command = new ListEventSourceMappingsCommand(input);
        const response = await this.client.send(command);

        return response.EventSourceMappings;
    }
}

module.exports = { LambdaClientListEventSourceMappings }