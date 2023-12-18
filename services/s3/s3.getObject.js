const { GetObjectCommand  } = require("@aws-sdk/client-s3");
const { S3ClientBase } = require("./s3.base");

class S3GetObject extends S3ClientBase
{
    async getImage(bucketName, imageName)
    {
        var input = 
        {
            Bucket: bucketName,
            Key: imageName
        };

        const command = new GetObjectCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { S3GetObject }