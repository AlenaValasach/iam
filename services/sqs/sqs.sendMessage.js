const { SQSClientBase } = require("./sqs.base");
const { SendMessageCommand } = require("@aws-sdk/client-sqs");

class SQSClientSendMessage extends SQSClientBase
{
    async getSendMessage(queueUrl, messageBody)
    {
        const input = {
            QueueUrl: queueUrl,
            MessageBody: messageBody,
        };
        
        const command = new SendMessageCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SQSClientSendMessage }