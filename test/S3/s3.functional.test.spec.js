const { AWS_CONFIG } = require('../../aws.config');

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const assert = require('node:assert/strict');

const { EC2ClientVpcs } = require('../../services/ec2/vpc/vpc.vpcs');
const { EC2ClientInstances } = require('../../services/ec2/ec2.instances');
const { EC2ClientVpcSubnets } = require('../../services/ec2/vpc/vpc.subnets');
const fs = require('fs-extra');
var FormData = require('form-data');
const { createWriteStream } = require("fs");


const axios = require('axios');
const { S3ListBuckets } = require('../../services/s3/s3.listBuckets');
const { S3BucketTagging } = require('../../services/s3/s3.bucketTagging');
const { S3BucketEncryption } = require('../../services/s3/s3.bucketEncryption');
const { S3BucketVersioning } = require('../../services/s3/s3.bucketVersioning');
const { S3BucketPublicAccessBlock, S3BucketPolicyStatus } = require('../../services/s3/s3.publicAccessBlock');
const { S3GetObject } = require('../../services/s3/s3.getObject');
const { S3GetListObjects } = require('../../services/s3/s3.getListObjects');
const { S3DeleteObject } = require('../../services/s3/s3.deleteObject');

let bucketName = "cloudximage-imagestorebucket";
let newBucketName = "cloudxserverless-imagestorebucket";


// Skip due to Error: PermanentRedirect: The bucket you are attempting to access must be addressed using the specified endpoint. Please send all future requests to this endpoint
/* test.skip("Upload images to the S3 bucket", async () => {
    let accessKeyId = AWS_CONFIG.accessKeyId;
    let secretAccessKey = AWS_CONFIG.secretAccessKey;
    let region = AWS_CONFIG.region;

    const credentials = { accessKeyId, secretAccessKey, region };
    let client = new S3Client(credentials);

    const input = {
        "Body": "flower.jpg",
        "Bucket": "examplebucket",
        "Key": "flower.jpg"
      };
      const command = new PutObjectCommand(input);
      const response = await client.send(command);

      console.log(response);
});  */

test("Upload images to the S3 bucket: Endpoint", async () => {
    let ec2ClientInstances = new EC2ClientInstances();
    const response = await ec2ClientInstances.getRunningInstances();

    let publicInstance = response.Reservations[0].Instances[0];
    let publicIpAddress = publicInstance.PublicIpAddress;

    const stream = fs.createReadStream("flower.jpg");

    const formData = new FormData();
    formData.append('upfile', stream);

    const formHeaders = formData.getHeaders();
    const headers =
    {
        ...formHeaders,
    };

    const res = await axios.post(`http://${publicIpAddress}/api/image`, formData, { headers });

    assert.equal(res.status, 200);
    assert.notEqual(res.data.id, undefined);

    console.log(res);
}); 

test("Download images from the S3 bucket", async () => {
    let s3ListBuckets = new S3ListBuckets();
    let buckets = await s3ListBuckets.getListBuckets();

    const bucket = buckets.find((bucket) => bucket.Name.startsWith(newBucketName));

    let s3ListObjects = new S3GetListObjects();
    let objects = await s3ListObjects.getListObjects(bucket.Name);

    assert.equal(objects.KeyCount > 0, true);
         
    // The path where you want to save the downloaded image
    const downloadFilePath = "./downloaded-image.jpg"; 

    const downloadImage = async () =>
    {
        try {
            let s3Object = new S3GetObject();
            let response = await s3Object.getImage(bucket.Name, objects.Contents[0].Key);
            
            // Save the image to local disk
            const writeStream = createWriteStream(downloadFilePath);
            response.Body.pipe(writeStream);
        }
        catch (err) {
            console.error("Error", err + "The image was not download.");
        }
    }
      
    downloadImage();
});

test("View a list of uploaded images", async () => {
    let s3ListBuckets = new S3ListBuckets();
    let buckets = await s3ListBuckets.getListBuckets();

    const bucket = buckets.find((bucket) => bucket.Name.startsWith(newBucketName));

    let s3ListObjects = new S3GetListObjects();
    let objects = await s3ListObjects.getListObjects(bucket.Name);

    assert.equal(objects.KeyCount > 0, true, "There are not any uploaded image in bucket.");
});

test("Delete an image from the S3 bucket", async () => {
    let s3ListBuckets = new S3ListBuckets();
    let buckets = await s3ListBuckets.getListBuckets();

    const bucket = buckets.find((bucket) => bucket.Name.startsWith(newBucketName));

    let s3ListObjects = new S3GetListObjects();
    let objects = await s3ListObjects.getListObjects(bucket.Name);

    let imageToDelete = objects.Contents[0].Key;

    let s3DeleteObjects = new S3DeleteObject();
    await s3DeleteObjects.deleteImage(bucket.Name, imageToDelete);

    let objectsAfterDeletion = await s3ListObjects.getListObjects(bucket.Name);

    assert.equal(objects.KeyCount - 1, objectsAfterDeletion.KeyCount, "There are not image deleted.");
});