const { LambdaClient, ListEventSourceMappingsCommand, ListFunctionsCommand } = require("@aws-sdk/client-lambda");
const { LambdaClientBase } = require("./lambda.base");

class LambdaClientListFunctions extends LambdaClientBase
{
    async getFunctions()
    {
        const command = new ListFunctionsCommand({});
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { LambdaClientListFunctions }