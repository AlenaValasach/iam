const { SQSClientBase } = require("./sqs.base");
const { SendMessageCommand, ListQueuesCommand, ListQueueTagsCommand } = require("@aws-sdk/client-sqs");

class SQSClientListQueueTags extends SQSClientBase
{
    async getListQueueTags(queueUrl)
    {     
        const input = {
            QueueUrl: queueUrl
        };

        const command = new ListQueueTagsCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SQSClientListQueueTags }