const { ListTopicsCommand, SubscribeCommand, GetTopicAttributesCommand } = require("@aws-sdk/client-sns");
const { SNSClientBase } = require("./sns.base");

class SNSClientTopicAttributes extends SNSClientBase
{
    async getTopicAttributes(topicArn)
    {
        const input = {
            TopicArn: topicArn
        };
        
        const command = new GetTopicAttributesCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SNSClientTopicAttributes }