const { GetBucketTaggingCommand } = require("@aws-sdk/client-s3");
const { S3ClientBase } = require("./s3.base");

class S3BucketTagging extends S3ClientBase
{
    async getBucketTagging(bucketName)
    {
        const input = {
            Bucket: bucketName
        };

        const command = new GetBucketTaggingCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { S3BucketTagging }