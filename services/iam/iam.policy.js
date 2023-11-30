const { IAMBase } = require("./iam.base");
const { GetPolicyCommand, GetPolicyVersionCommand } = require ('@aws-sdk/client-iam');

class IAMPolicy extends IAMBase
{
    async getPolicy(policyName)
    {
        const POLICY_ARN = `arn:aws:iam::${this.accountId}:policy/${policyName}`;
    
        const input = { // GetPolicyRequest
            PolicyArn: POLICY_ARN,
        };
    
        const command = new GetPolicyCommand(input);
        const response = await this.client.send(command); 

        return response
    }

    async getPolicyDocument(policyName, versionId)
    {
        const POLICY_ARN = `arn:aws:iam::${this.accountId}:policy/${policyName}`;

        const input2 = { // GetPolicyVersionRequest
            PolicyArn: POLICY_ARN, // required
            VersionId: versionId, // required
          };
          const command = new GetPolicyVersionCommand(input2);
          const policyVersionResponce = await this.client.send(command);
      
          // Decode the URL-encoded JSON document
          const decodedDocument = decodeURIComponent(policyVersionResponce.PolicyVersion.Document);
          const actualPolicy = JSON.parse(decodedDocument);

          return actualPolicy;
    }
}

module.exports = { IAMPolicy }