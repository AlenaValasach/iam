const { DescribeSecurityGroupsCommand  } = require("@aws-sdk/client-ec2");
const { EC2ClientBase } = require("./ec2.base");

class EC2ClientSecurityGroup extends EC2ClientBase
{
    async getSecurityGroups(groupIds)
    {
        const input = {
            Filters: 
            [
                { 
                    GroupIds: groupIds ,
                },
            ]
        };
    
        const command = new DescribeSecurityGroupsCommand (input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { EC2ClientSecurityGroup }