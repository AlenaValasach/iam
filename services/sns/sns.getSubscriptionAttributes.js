const { ConfirmSubscriptionCommand, GetSubscriptionAttributesCommand } = require("@aws-sdk/client-sns");
const { SNSClientBase } = require("./sns.base");

class SNSClientGetSubscriptionAttributes extends SNSClientBase
{
    async getSubscriptionAttributes(subscriptionArn)
    {
        const input = {
            SubscriptionArn: subscriptionArn
        };
        
        const command = new GetSubscriptionAttributesCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SNSClientGetSubscriptionAttributes }