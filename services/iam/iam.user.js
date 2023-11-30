const { ListGroupsForUserCommand   } = require ('@aws-sdk/client-iam');
const { IAMBase } = require('./iam.base');

class IAMUser extends IAMBase
{
    async geUserGroups(userName)
    {
        const input = { 
            UserName: userName,
          };
        const command = new ListGroupsForUserCommand(input);
        const response = await this.client.send(command);

        return response.Groups;
    }
}

module.exports = { IAMUser }