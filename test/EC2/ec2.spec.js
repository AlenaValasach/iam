const assert = require('node:assert/strict');
const { EC2ClientInstances } = require('../../services/ec2/ec2.instances');

let expectedPolicies = require('../data/ec2.instances.json');
const { EC2ClientSecurityGroup } = require("../../services/ec2/ec2.securityGroup");
const { EC2ClientImages } = require("../../services/ec2/ec2.images");

test("Get Instances", async () => {
    const instances = [];

    let ec2ClientInstances = new EC2ClientInstances();
    const response = await ec2ClientInstances.getRunningInstances();

    response.Reservations.forEach(r => instances.push(r.Instances));

    assert.equal(2, instances.length)
});

expectedPolicies.forEach(data => {
    test(`Verify Instances configuration: ${data.InstanceName}`, async () => {
        let ec2ClientInstances = new EC2ClientInstances();
        const instance = await ec2ClientInstances.getInstanceByName(data.InstanceName);

        let instanceType = instance.InstanceType;
        let tags = instance.Tags;
        let os = instance.PlatformDetails;
        let ipAddress = instance.PublicIpAddress;

        let actualTags = tags.map(t => t.Key);
        const areTagsPresented = data.tags.some(t=> actualTags.includes(t))

        assert.equal(data.InstanceType, instanceType)
        assert.equal(data.os, os)
        assert.equal(true, areTagsPresented)

        if (data.isPublic)
        {
            assert.notEqual(undefined, ipAddress)
        }
        else
        {
            assert.equal(undefined, ipAddress)
        }  
        
        let ec2ClientImages = new EC2ClientImages();
        const image = await ec2ClientImages.getImage(instance.ImageId);

        let imageEbs = image.BlockDeviceMappings[0].Ebs;
        let volumeSize = imageEbs.VolumeSize;
        let volumeType = imageEbs.VolumeType;

        assert.equal(data.VolumeSize, volumeSize)
        assert.equal(data.VolumeType, volumeType)
    });
});

expectedPolicies.forEach(data => {
    test(`Verify security groups' configuration: ${data.InstanceName}`, async () => {
        let ec2ClientInstances = new EC2ClientInstances();
        const instance = await ec2ClientInstances.getInstanceByName(data.InstanceName);

        let groupsIds = instance.SecurityGroups.map(s => s.GroupId);

        let ec2ClientSecurityGroup = new EC2ClientSecurityGroup();
        const groups = await ec2ClientSecurityGroup.getSecurityGroups(groupsIds); 
        
        let group = groups.SecurityGroups.find(g => g.Description === data.SecurityGroupName);

        if (!data.isPublic)
        {
            let publicGroup = groups.SecurityGroups.find(g => g.Description.includes("PublicInstance"));

            data.IpPermissions.forEach(p => p.UserIdGroupPairs.forEach(u => u.GroupId = publicGroup.GroupId));
            data.IpPermissions.forEach(p => p.UserIdGroupPairs.forEach(u => u.UserId = publicGroup.OwnerId));
        }

        assert.deepEqual(data.IpPermissions, group.IpPermissions)
    });
});


