const {GetTrailCommand } = require("@aws-sdk/client-cloudtrail");
const { CloudTrailClientBase } = require("./cloudTrail.base");

class CloudTrailClientTrail extends CloudTrailClientBase
{
    async getTrail(name)
    {
        const input = { 
            Name: name
        };

        const command = new GetTrailCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { CloudTrailClientTrail }