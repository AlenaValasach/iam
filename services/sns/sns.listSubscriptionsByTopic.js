const { ConfirmSubscriptionCommand, ListSubscriptionsByTopicCommand } = require("@aws-sdk/client-sns");
const { SNSClientBase } = require("./sns.base");

class SNSClientListSubscriptionsByTopic extends SNSClientBase
{
    async getListSubscriptionsByTopic(topicArn)
    {
        const input = {
            TopicArn: topicArn
        };
        
        const command = new ListSubscriptionsByTopicCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SNSClientListSubscriptionsByTopic }