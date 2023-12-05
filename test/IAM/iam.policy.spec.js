const assert = require('node:assert/strict');
const { IAMPolicy } = require('../../services/iam/iam.policy');

let expectedPolicies = require('../data/iam.policy.json');

expectedPolicies.forEach(data => { 
    test(`Get IAM policies ${data.PolicyName}`, async () => {
        let iamPolicy =  new IAMPolicy();
        let policy = await iamPolicy.getPolicy(data.PolicyName);
        let policyDocument = await iamPolicy.getPolicyDocument(data.PolicyName, policy.Policy.DefaultVersionId);

        let statement = JSON.stringify(policyDocument.Statement)

        assert.deepEqual(policyDocument.Statement, data.Statement)
    });
});
