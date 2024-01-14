const { DynamoDBClientTables } = require("../../services/dynamoDb/dynamoDb.listTables");
const { DynamoDBClientScan } = require("../../services/dynamoDb/dynamoDb.scan");
const { EC2ClientInstances } = require("../../services/ec2/ec2.instances");
const { uploadImage, deleteImage, deleteImageById, getImages, deleteImages } = require("../../utilits/image.helper");
const axios = require('axios');
const assert = require('node:assert/strict');

let dynamoDBTableName;
let publicIpAddress;
let imageId;

const dynamoDbTable = "cloudxserverless-DatabaseImagesTable"

describe('Functional DynamoDB validation', function () {
    beforeAll(async () => {
        let ec2ClientInstances = new EC2ClientInstances();
        const instanceResponse = await ec2ClientInstances.getRunningInstances();

        publicIpAddress = instanceResponse.Reservations[0].Instances[0].PublicIpAddress;

        let dynamoDbTables = new DynamoDBClientTables();
        const tables = await dynamoDbTables.getTables();
    
        dynamoDBTableName = tables.TableNames.find(t => t.includes(dynamoDbTable));

        assert.notEqual(dynamoDBTableName, undefined, 'Dynamo Db is not found.');

        imageId = await uploadImage("flower.jpg", publicIpAddress);
    });

    test("The uploaded image metadata should be stored in DynamoDB table", async () => {
        let dynamoDbScan = new DynamoDBClientScan();
        const responce = await dynamoDbScan.scan(dynamoDBTableName);

        const images = responce.Items.find(i => i.object_key.S.includes("flower"));

        assert.notEqual(images, undefined, 'There is no image in the database with id ');
    }); 

    test('The image metadata should be returned by {base URL}/image/{image_id} GET request', async () => {
        const response = await axios.get(`http://${publicIpAddress}/api/image/${imageId}`);

        assert.equal(response.status, 200);

        assert.notEqual(response.data.id, undefined);
        assert.notEqual(response.data.object_key, undefined);
        assert.notEqual(response.data.object_type, undefined);
        assert.notEqual(response.data.object_size, undefined);
        assert.notEqual(response.data.created_at, undefined);
        assert.notEqual(response.data.last_modified, undefined);
    });

    test('The image metadata for the deleted image should be deleted from the database', async () => {
        await deleteImageById(publicIpAddress, imageId);

        let responce = await getImages(publicIpAddress);
        const imagesAPILength = responce.data.length;

        let dynamoDbScan = new DynamoDBClientScan();
        const responceScan = await dynamoDbScan.scan(dynamoDBTableName);

        const imageIds = responceScan.Items.map(i => i.id.S);
        const imagesDBLength = responceScan.Items.length;

        assert.equal(imagesAPILength, imagesDBLength);
        assert.equal(imageIds.includes(imageId), false, 'There is image in the database with id ' + imageId);
    });
});