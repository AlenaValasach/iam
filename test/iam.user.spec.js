const { AWS_CONFIG } = require('../aws.config');
const { IAMUser } = require('../services/iam/iam.user');
const assert = require('node:assert/strict');

let expectedUsers = require('../test/data/iam.user.json');

expectedUsers.forEach(data => { 
  test(`Get IAM users ${data.UserName}`, async () => {
      let iamUser=  new IAMUser();

      let userGroups = await iamUser.geUserGroups(data.UserName);

      data.Groups.forEach(p => p.Arn = p.Arn.replace("accountId", AWS_CONFIG.accountId));
      data.Groups.forEach(p => p.CreateDate = new Date(p.CreateDate));

      assert.equal(1, userGroups.length)
      assert.deepEqual(userGroups, data.Groups)
  });
});