const assert = require('node:assert/strict');

const { EC2ClientVpcs } = require('../../services/ec2/vpc/vpc.vpcs');
const { EC2ClientInstances } = require('../../services/ec2/ec2.instances');
const { EC2ClientVpcSubnets } = require('../../services/ec2/vpc/vpc.subnets');

const { Client } = require('ssh2');
const { readFileSync } = require('fs');
const { AWS_CONFIG } = require('../../aws.config');

const axios = require('axios');
const { S3ListBuckets } = require('../../services/s3/s3.listBuckets');
const { S3BucketTagging } = require('../../services/s3/s3.bucketTagging');
const { S3BucketEncryption } = require('../../services/s3/s3.bucketEncryption');
const { S3BucketVersioning } = require('../../services/s3/s3.bucketVersioning');
const { S3BucketPublicAccessBlock, S3BucketPolicyStatus } = require('../../services/s3/s3.publicAccessBlock');
require("@aws-sdk/client-ec2-instance-connect");

test("The applications should be deployed in public subnet", async () => {
    let ec2ClientVpcs = new EC2ClientVpcs();
    const vpcs = await ec2ClientVpcs.getVpcByIsDefault(false);

    let ec2ClientVpcSubnets = new EC2ClientVpcSubnets();
    const subnets = await ec2ClientVpcSubnets.getVpcSubnets(vpcs[0].VpcId);
    const subnetTags = subnets.map(s => s.Tags.find(({ Key }) => Key === 'aws-cdk:subnet-type')?.Value);

    // should be deployed in public subnet
    assert.equal(true, subnetTags.includes('Public'));

    let ec2ClientInstances = new EC2ClientInstances();
    const response = await ec2ClientInstances.getRunningInstances();

    let publicInstance = response.Reservations[0].Instances[0];
    let publicIpAddress = publicInstance.PublicIpAddress;
    let publicDnsName = publicInstance.PublicDnsName;

    // should be accessible by HTTP from the internet via an Internet gateway by public IP address and FQDN
    const responseIpAddress = await axios.get(`http://${publicIpAddress}/api/image`);
    const responsePublicDnsName = await axios.get(`http://${publicDnsName}/api/image`);

    assert.equal(responseIpAddress.status, 200);
    assert.equal(responsePublicDnsName.status, 200);
}); 

test("The application instance should be accessible by SSH protocol", async () => {
    const privateKey = readFileSync("cloudximage-us-east-1.pem", 'utf8');

    let ec2ClientInstances = new EC2ClientInstances();
    const response = await ec2ClientInstances.getRunningInstances();

    let publicInstance = response.Reservations[0].Instances[0];
    let publicIpAddress = publicInstance.PublicIpAddress;

    let client = new Client();

    const config = {
      host: publicIpAddress,
      port: '22',
      username: 'ec2-user',
      privateKey: privateKey
    }

    async function connectClient(conn, config) {
        return new Promise((resolve, reject) => {
            conn
               .on('ready', () => {
                console.log('SSH connection successful');
                resolve(conn);
              })
              .on('error', (error) => {
                console.log(`Error: ${error.message}`);
                reject(error);
              }) 
              .connect(config);
          });
      }

    const connectedClient = await connectClient(client, config);

    console.log(connectedClient);
}); 

test("The application should have access to the S3 bucket via an IAM role", async () => {
    let s3ListBuckets = new S3ListBuckets();
    let buckets = await s3ListBuckets.getListBuckets();

    const bucket = buckets.find((bucket) => bucket.Name.startsWith("cloudximage-imagestorebucket"));

    assert.equal(bucket !== undefined, true);

    let s3BucketTagging = new S3BucketTagging();
    let bucketTagging = await s3BucketTagging.getBucketTagging(bucket.Name);
    const cloudxTag = await bucketTagging.TagSet.find(t => t.Key === "cloudx")

    let s3BucketEncryption= new S3BucketEncryption();
    let bucketEncryption = await s3BucketEncryption.getBucketEncryption(bucket.Name);
    let sseAlgorithm = bucketEncryption.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;

    let s3BucketVersioning= new S3BucketVersioning();
    let bucketVersioning = await s3BucketVersioning.getBucketVersioning(bucket.Name);

    let s3BucketPolicyStatus= new S3BucketPolicyStatus();
    let bucketPolicyStatus = await s3BucketPolicyStatus.getBucketPolicyStatus(bucket.Name);
    
    assert.equal(cloudxTag.Key, "cloudx")
    assert.equal(cloudxTag.Value, "qa")
    assert.equal(sseAlgorithm, "AES256")
    assert.equal(bucketVersioning.Status, undefined)
    assert.equal(bucketPolicyStatus.PolicyStatus.IsPublic , false)
}); 