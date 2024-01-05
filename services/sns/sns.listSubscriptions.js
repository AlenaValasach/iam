const { ConfirmSubscriptionCommand, ListSubscriptionsByTopicCommand, ListSubscriptionsCommand } = require("@aws-sdk/client-sns");
const { SNSClientBase } = require("./sns.base");

class SNSClientListSubscriptions extends SNSClientBase
{
    async getListSubscriptions()
    {
        const command = new ListSubscriptionsCommand({});
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SNSClientListSubscriptions }