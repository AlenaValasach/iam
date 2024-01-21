const { ListTagsCommand } = require("@aws-sdk/client-cloudtrail");
const { CloudTrailClientBase } = require("./cloudTrail.base");

class CloudTrailClientListTags extends CloudTrailClientBase
{
    async getListTags(resourceIdList)
    {
        const input = { 
            ResourceIdList: resourceIdList
        };

        const command = new ListTagsCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { CloudTrailClientListTags }