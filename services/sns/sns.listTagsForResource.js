const { ListTagsForResourceCommand } = require("@aws-sdk/client-sns");
const { SNSClientBase } = require("./sns.base");

class SNSClientListTags extends SNSClientBase
{
    async getListTagsForResource(topicArn)
    {
        const input = {
            ResourceArn: topicArn
        };
        
        const command = new ListTagsForResourceCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { SNSClientListTags }