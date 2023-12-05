const { DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const { EC2ClientBase } = require("./ec2.base");

class EC2ClientInstances extends EC2ClientBase
{
    async getRunningInstances()
    {
        const input = {
            Filters: 
            [
                { 
                Name: "instance-state-name",
                Values: ['running'],
                },
            ]
        };
    
        const command = new DescribeInstancesCommand(input);
        const response = await this.client.send(command);

        return response;
    }

    async getInstance(instanceId)
    {
        const input = {"InstanceIds": [
            instanceId]};
    
        const command = new DescribeInstancesCommand(input);
        const response = await this.client.send(command);

        return response.Reservations[0].Instances[0];
    }

    async getInstanceByName(instanceName)
    {
        const input = {
            "Filters": [
              {
                "Name": "tag:Name",
                "Values": [
                    instanceName
                ]
              }
            ]
          };
    
        const command = new DescribeInstancesCommand(input);
        const response = await this.client.send(command);

        return response.Reservations[0].Instances[0];
    }
}

module.exports = { EC2ClientInstances }