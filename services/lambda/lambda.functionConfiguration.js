const { LambdaClient, ListEventSourceMappingsCommand, GetFunctionConfigurationCommand } = require("@aws-sdk/client-lambda");
const { LambdaClientBase } = require("./lambda.base");

class LambdaClientFunctionConfiguration extends LambdaClientBase
{
    async getFunctionConfiguration(lambdaFunctionName)
    {
        const input = { 
            FunctionName: lambdaFunctionName
          };
    
        const command = new GetFunctionConfigurationCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { LambdaClientFunctionConfiguration }