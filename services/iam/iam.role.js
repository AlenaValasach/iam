const { GetRoleCommand, ListAttachedRolePoliciesCommand, ListRolesCommand   } = require ('@aws-sdk/client-iam');
const { IAMBase } = require('./iam.base');

class IAMRole extends IAMBase
{
    async getRole(roleName)
    {
        const input = {
            RoleName: roleName, 
          };

        const command = new GetRoleCommand(input);
        const response = await this.client.send(command);

        return response
    }

    async getRoleDocument(roleName)
    {
        const response = await this.getRole(roleName)

        const decodedDocument = decodeURIComponent(response.Role.AssumeRolePolicyDocument);

        return decodedDocument
    }

    async getRolePolicies(roleName)
    {
        const input = {
            RoleName: roleName
          };

        const command = new ListAttachedRolePoliciesCommand (input);
        const response = await this.client.send(command);

        return response.AttachedPolicies;
    }

    async getRoles()
    {
        const command = new ListRolesCommand({});
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { IAMRole }