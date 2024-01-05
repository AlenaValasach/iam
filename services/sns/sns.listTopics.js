const { ListTopicsCommand } = require("@aws-sdk/client-sns");
const { SNSClientBase } = require("./sns.base");

class SNSClientListTopics extends SNSClientBase
{
    async getListTopics()
    {
        const command = new ListTopicsCommand({});
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SNSClientListTopics }