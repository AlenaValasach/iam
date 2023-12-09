const { DescribeSubnetsCommand  } = require("@aws-sdk/client-ec2");
const { EC2ClientBase } = require("../ec2.base");

const assert = require('node:assert/strict');

class EC2ClientVpcSubnets extends EC2ClientBase
{
    async getVpcSubnets(vpcId)
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

        const command = new DescribeSubnetsCommand(input);
        const response = await this.client.send(command);

        return response.Subnets;
    }

    async getPublicVpcSubnet()
    {
        let subnets = await this.getVpcSubnets();

        let publicSubnet = subnets.filter(s => s.Tags).find((subnet) =>
        subnet.Tags.find(({ Key, Value }) => Key === 'aws-cdk:subnet-name' && Value === 'PublicSubnet'),
        );

        return publicSubnet;
    }

    async getPrivateVpcSubnet()
    {
        let subnets = await this.getVpcSubnets();

        let privateSubnet = subnets.filter(s => s.Tags).find((subnet) =>
        subnet.Tags.find(({ Key, Value }) => Key === 'aws-cdk:subnet-name' && Value === 'PrivateSubnet'),
        );

        return privateSubnet;
    }
}

module.exports = { EC2ClientVpcSubnets }