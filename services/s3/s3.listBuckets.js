const { ListBucketsCommand } = require("@aws-sdk/client-s3");
const { S3ClientBase } = require("./s3.base");

class S3ListBuckets extends S3ClientBase
{
    async getListBuckets()
    {
        const command = new ListBucketsCommand({});
        const response = await this.client.send(command);

        return response.Buckets;
    }
}

module.exports = { S3ListBuckets }