const { GetBucketPolicyStatusCommand   } = require("@aws-sdk/client-s3");
const { S3ClientBase } = require("./s3.base");

class S3BucketPolicyStatus extends S3ClientBase
{
    async getBucketPolicyStatus(bucketName)
    {
        const input = {
            Bucket: bucketName
        };

        const command = new GetBucketPolicyStatusCommand (input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { S3BucketPolicyStatus }