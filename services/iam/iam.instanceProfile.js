const { ListGroupsForUserCommand, GetInstanceProfileCommand   } = require ('@aws-sdk/client-iam');
const { IAMBase } = require('./iam.base');

class IAMInstanceProfile extends IAMBase
{
    async getInstanceProfile(instanceProfileName)
    {
        const input = { 
            InstanceProfileName: instanceProfileName
        };

        const command = new GetInstanceProfileCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { IAMInstanceProfile }