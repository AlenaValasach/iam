const { DescribeImagesCommand } = require("@aws-sdk/client-ec2");
const { EC2ClientBase } = require("./ec2.base");

class EC2ClientImages extends EC2ClientBase
{
    async getImage(imageId)
    {
        const input = { 
            ImageIds: 
            [ 
                imageId,
            ],
          };
    
        const command = new DescribeImagesCommand(input);
        const response = await this.client.send(command);

        return response.Images?.[0];
    }
}

module.exports = { EC2ClientImages }