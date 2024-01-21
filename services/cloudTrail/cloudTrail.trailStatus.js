const { GetTrailStatusCommand } = require("@aws-sdk/client-cloudtrail");
const { CloudTrailClientBase } = require("./cloudTrail.base");

class CloudTrailClientTrailStatus extends CloudTrailClientBase
{
    async getTrailStatus(name)
    {
        const input = { 
            Name: name
        };

        const command = new GetTrailStatusCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { CloudTrailClientTrailStatus }