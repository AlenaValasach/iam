const { SQSClientBase } = require("./sqs.base");
const { SendMessageCommand, ListQueuesCommand, ListQueueTagsCommand, GetQueueAttributesCommand } = require("@aws-sdk/client-sqs");

class SQSClientQueueAttributes extends SQSClientBase
{
    async getQueueAttributes(queueUrl)
    {     
        const input = {
            QueueUrl: queueUrl,
            AttributeNames: ['All']
        };

        const command = new GetQueueAttributesCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SQSClientQueueAttributes }