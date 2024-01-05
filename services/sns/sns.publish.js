const { ListTopicsCommand, SubscribeCommand, PublishCommand } = require("@aws-sdk/client-sns");
const { SNSClientBase } = require("./sns.base");

class SNSClientPublish extends SNSClientBase
{
    async publish(topicArn, message)
    {
        const input = {
            TopicArn: topicArn,
            Message: message,
        };
        
        const command = new PublishCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SNSClientPublish }