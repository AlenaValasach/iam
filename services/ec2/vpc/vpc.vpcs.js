const { DescribeVpcsCommand } = require("@aws-sdk/client-ec2");
const { EC2ClientBase } = require("../ec2.base");

const assert = require('node:assert/strict');

class EC2ClientVpcs extends EC2ClientBase
{
    async getVpcs()
    {
        const command = new DescribeVpcsCommand({});
        const response = await this.client.send(command);

        return response.Vpcs;
    }

    async getVpcByName(vpcName)
    {
        const input = {
            "Filters": [
              {
                "Name": "tag:Name",
                "Values": [
                    vpcName
                ]
              }
            ]
          };
    
        const command = new DescribeVpcsCommand(input);
        const response = await this.client.send(command);

        assert.equal(1, response.Vpcs.length);

        return response.Vpcs[0];
    }

    async getVpcByIsDefault(isDefault)
    {
        const input = {
            "Filters": [
              {
                "Name": "isDefault",
                "Values": [
                    isDefault
                ]
              }
            ]
          };
    
        const command = new DescribeVpcsCommand(input);
        const response = await this.client.send(command);

        return response.Vpcs;
    }
}

module.exports = { EC2ClientVpcs }