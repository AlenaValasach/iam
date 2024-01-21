const { DescribeTrailsCommand } = require("@aws-sdk/client-cloudtrail");
const { CloudTrailClientBase } = require("./cloudTrail.base");

class CloudTrailClientTrails extends CloudTrailClientBase
{
    async getTrails()
    {
        const command = new DescribeTrailsCommand({});
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { CloudTrailClientTrails }