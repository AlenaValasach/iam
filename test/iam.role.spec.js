const { AWS_CONFIG } = require('../aws.config');
const { IAMRole } = require('../services/iam/iam.role/iam.role');
const assert = require('node:assert/strict');

let expectedRoles = require('../test/data/iam.role.json');

expectedRoles.forEach(data => { 
  test(`Get IAM roles ${data.RoleName}`, async () => {
      let iamRole =  new IAMRole();

      let rolePolicies = await iamRole.getRolePolicies(data.RoleName);

      data.Policies.forEach(p => p.PolicyArn = p.PolicyArn.replace("accountId", AWS_CONFIG.accountId));

      assert.equal(1, rolePolicies.length)
      assert.deepEqual(rolePolicies, data.Policies)
  });
});