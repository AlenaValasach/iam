const { EC2ClientInstances } = require("../../services/ec2/ec2.instances");
const { S3GetObject } = require("../../services/s3/s3.getObject");
const { uploadImage, deleteImage, deleteImageById, getImages, deleteImages } = require("../../utilits/image.helper");
const axios = require('axios');
const assert = require('node:assert/strict');

const fs = require('fs-extra');
var FormData = require('form-data');
const { createWriteStream } = require("fs");
const { S3GetListObjects } = require("../../services/s3/s3.getListObjects");
const { S3ListBuckets } = require("../../services/s3/s3.listBuckets");
const { S3DeleteObject } = require("../../services/s3/s3.deleteObject");

let publicIpAddress;
let imageId;

const imagestorebucket = 'cloudxserverless-imagestorebucket';
let bucket;

describe.skip('Functional S3 validation', function () {
    beforeAll(async () => {
        let ec2ClientInstances = new EC2ClientInstances();
        const instanceResponse = await ec2ClientInstances.getRunningInstances();

        publicIpAddress = instanceResponse.Reservations[0].Instances[0].PublicIpAddress;

        imageId = await uploadImage("flower.jpg", publicIpAddress);

        assert.notEqual(imageId, undefined, 'The image is not uploaded.');

        let s3ListBuckets = new S3ListBuckets();
        let buckets = await s3ListBuckets.getListBuckets();
    
        bucket = buckets.find((bucket) => bucket.Name.startsWith(imagestorebucket));
    });

    afterAll(async () => {
        await deleteImages(publicIpAddress);
    });

    test("Download images from the S3 bucket", async () => {
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
        let s3ListObjects = new S3GetListObjects();
        let objects = await s3ListObjects.getListObjects(bucket.Name);
    
        assert.equal(objects.KeyCount > 0, true, "There are not any uploaded image in bucket.");
    });

    test("Delete an image from the S3 bucket", async () => {
        let s3ListObjects = new S3GetListObjects();
        let objects = await s3ListObjects.getListObjects(bucket.Name);
    
        let imageToDelete = objects.Contents[0].Key;
    
        let s3DeleteObjects = new S3DeleteObject();
        await s3DeleteObjects.deleteImage(bucket.Name, imageToDelete);
    
        let objectsAfterDeletion = await s3ListObjects.getListObjects(bucket.Name);
    
        assert.equal(objects.KeyCount - 1, objectsAfterDeletion.KeyCount, "There are not image deleted.");
    });
});