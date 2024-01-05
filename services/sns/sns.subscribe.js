const { ListTopicsCommand, SubscribeCommand } = require("@aws-sdk/client-sns");
const { SNSClientBase } = require("./sns.base");

class SNSClientSubscribe extends SNSClientBase
{
    async getSubscribe(topicArn, endpoint)
    {
        const input = {
            TopicArn: topicArn,
            Protocol: "email",
            Endpoint: endpoint
        };
        
        const command = new SubscribeCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SNSClientSubscribe }