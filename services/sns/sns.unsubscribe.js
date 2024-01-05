const { ConfirmSubscriptionCommand, ListSubscriptionsByTopicCommand, UnsubscribeCommand } = require("@aws-sdk/client-sns");
const { SNSClientBase } = require("./sns.base");

class SNSClientUnsubscribe extends SNSClientBase
{
    async unsubscribe(subscriptionArn)
    {
        const input = {
            SubscriptionArn: subscriptionArn
        };
        
        const command = new UnsubscribeCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SNSClientUnsubscribe }