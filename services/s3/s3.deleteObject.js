const { DeleteObjectCommand  } = require("@aws-sdk/client-s3");
const { S3ClientBase } = require("./s3.base");

class S3DeleteObject extends S3ClientBase
{
    async deleteImage(bucketName, imageName)
    {
        var input = 
        {
            Bucket: bucketName,
            Key: imageName
        };

        const command = new DeleteObjectCommand(input);
        await this.client.send(command);
    }
}

module.exports = { S3DeleteObject }