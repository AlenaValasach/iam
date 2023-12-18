const { GetBucketVersioningCommand   } = require("@aws-sdk/client-s3");
const { S3ClientBase } = require("./s3.base");

class S3BucketVersioning extends S3ClientBase
{
    async getBucketVersioning(bucketName)
    {
        const input = {
            Bucket: bucketName
        };

        const command = new GetBucketVersioningCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { S3BucketVersioning }