const { GetBucketEncryptionCommand  } = require("@aws-sdk/client-s3");
const { S3ClientBase } = require("./s3.base");

class S3BucketEncryption extends S3ClientBase
{
    async getBucketEncryption(bucketName)
    {
        const input = {
            Bucket: bucketName
        };

        const command = new GetBucketEncryptionCommand(input);
        const response = await this.client.send(command);

        return response.ServerSideEncryptionConfiguration;
    }
}

module.exports = { S3BucketEncryption }