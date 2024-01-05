const { SQSClientBase } = require("./sqs.base");
const { SendMessageCommand, ListQueuesCommand } = require("@aws-sdk/client-sqs");

class SQSClientListQueues extends SQSClientBase
{
    async getListQueues()
    {     
        const command = new ListQueuesCommand({});
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SQSClientListQueues }