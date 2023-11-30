const { GetRoleCommand, ListAttachedRolePoliciesCommand   } = require ('@aws-sdk/client-iam');
const { IAMBaseRole } = require('./iam.role.base');

class IAMRole extends IAMBaseRole
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
}

module.exports = { IAMRole }