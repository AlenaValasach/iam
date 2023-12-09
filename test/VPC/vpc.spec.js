const assert = require('node:assert/strict');

let expectedVpcs = require('../data/vps.json');
const { EC2ClientVpcs } = require('../../services/ec2/vpc/vpc.vpcs');
const { EC2ClientInstances } = require('../../services/ec2/ec2.instances');
const { EC2ClientVpcSubnets } = require('../../services/ec2/vpc/vpc.subnets');

test("Verify VPCs configuration (IsDefault, CIDR block, Tags)", async () => {
    const expectedVpc1 = expectedVpcs[0];
    const expectedVpc2 = expectedVpcs[1];

    let ec2ClientVpcs = new EC2ClientVpcs();
    const vpcs = await ec2ClientVpcs.getVpcs();

    assert.equal(2, vpcs.length);

    const vpc1 = await ec2ClientVpcs.getVpcByName(expectedVpc1.VpcName);

    let tagsVpc1 = vpc1.Tags.map(t => t.Key);
    const areTagsPresented = expectedVpc1.tags.some(t => tagsVpc1.includes(t))

    assert.equal(expectedVpc1.IsDefault, vpc1.IsDefault, "VPC1: Verify Vpc is non-default VPC")    
    assert.equal(expectedVpc1.CidrBlock, vpc1.CidrBlock, "VPC1: Verify VPC CIDR Block");
    assert.equal(true, areTagsPresented, "VPC1: Verify VPC tags: Name, cloudx");

    const vpc2 = vpcs.find(v => v.VpcId !== vpc1.VpcId)

    assert.equal(expectedVpc2.IsDefault, vpc2.IsDefault, "VPC2: Verify Vpc is not default VPC");
    assert.equal(expectedVpc2.CidrBlock, vpc2.CidrBlock, "VPC2: Verify VPC CIDR Block");
    assert.equal(undefined, vpc2.Tags, "VPC2: Verify VPC doesn't contain tags");
});

test("The applications should be deployed in non-default VPC", async () => {
    let ec2ClientVpcs = new EC2ClientVpcs();
    const vpcs = await ec2ClientVpcs.getVpcByIsDefault(false);

    assert.equal(1, vpcs.length);

    const expectedVpc = vpcs[0].VpcId;

    let ec2ClientInstances = new EC2ClientInstances();
    const response = await ec2ClientInstances.getRunningInstances();

    assert.equal(2, response.Reservations.length);

    let instancesVpcIds = response.Reservations.map(r => r.Instances[0].NetworkInterfaces[0].VpcId);

    assert.equal(expectedVpc, instancesVpcIds[0], "The first application should be deployed in non-default VPC");
    assert.equal(expectedVpc, instancesVpcIds[1], "The second application should be deployed in non-default VPC");
}); 

test("Verify VPC has 2 subnets: public and private", async () => {
    let ec2ClientVpcs = new EC2ClientVpcs();
    const vpcs = await ec2ClientVpcs.getVpcByIsDefault(false);

    assert.equal(1, vpcs.length);

    const expectedVpc = vpcs[0].VpcId;

    let ec2ClientVpcSubnets = new EC2ClientVpcSubnets();
    const subnets = await ec2ClientVpcSubnets.getVpcSubnets(expectedVpc);

    assert.equal(2, subnets.length);

    const subnetTags = subnets.map(s => s.Tags.find(({ Key }) => Key === 'aws-cdk:subnet-type')?.Value);

    assert.equal(2, subnetTags.length);
    assert.equal(true, subnetTags.includes('Public'));
    assert.equal(true, subnetTags.includes('Private'));
}); 