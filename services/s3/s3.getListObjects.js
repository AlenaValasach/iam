const { ListObjectsV2Command  } = require("@aws-sdk/client-s3");
const { S3ClientBase } = require("./s3.base");

class S3GetListObjects extends S3ClientBase
{
    async getListObjects(bucketName)
    {
        var input = 
        {
            Bucket: bucketName
        };

        const command = new ListObjectsV2Command(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { S3GetListObjects }