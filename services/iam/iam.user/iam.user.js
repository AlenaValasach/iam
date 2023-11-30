const { ListGroupsForUserCommand   } = require ('@aws-sdk/client-iam');
const { IAMBaseUser } = require('./iam.user.base');

class IAMUser extends IAMBaseUser
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