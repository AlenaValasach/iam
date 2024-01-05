const { ConfirmSubscriptionCommand } = require("@aws-sdk/client-sns");
const { SNSClientBase } = require("./sns.base");

class SNSClientConfirmSubscription extends SNSClientBase
{
    async confirmSubscription(topicArn, token)
    {
        const input = {
            TopicArn: topicArn,
            Token: token
        };
        
        const command = new ConfirmSubscriptionCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SNSClientConfirmSubscription }