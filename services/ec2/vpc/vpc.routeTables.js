const { DescribeRouteTablesCommand  } = require("@aws-sdk/client-ec2");
const { EC2ClientBase } = require("../ec2.base");

const assert = require('node:assert/strict');

class EC2ClientVpcRouteTables extends EC2ClientBase
{
    async getVpcRouteTablesBySubnetId(subnetId)
    {
        const input = (subnetId === undefined)
        ? {}
        :  
        {
            "Filters": [
              {
                "Name": "association.subnet-id",
                "Values": [
                    subnetId
                ]
              }
            ]
        };

        const command = new DescribeRouteTablesCommand(input);
        const response = await this.client.send(command);

        return response.RouteTables;
    }
    async getVpcRouteTablesByVpcId(vpcId)
    {
        const input = (vpcId === undefined)
        ? {}
        :  
        {
            "Filters": [
              {
                "Name": "vpc-id",
                "Values": [
                    vpcId
                ]
              }
            ]
        };

        const command = new DescribeRouteTablesCommand(input);
        const response = await this.client.send(command);

        return response.RouteTables;
    }
}

module.exports = { EC2ClientVpcRouteTables }