const assert = require('node:assert/strict');
const { EC2ClientInstances } = require('../../services/ec2/ec2.instances');
const { AWS_CONFIG } = require('../../aws.config');

const { default: axios } = require('axios');

test("Get Instance details by endpoint", async () => {
    let ec2ClientInstances = new EC2ClientInstances();
    const response = await ec2ClientInstances.getRunningInstances();

    let publicInstance = response.Reservations[0].Instances[0];
    let publicIpAddress = publicInstance.PublicIpAddress;
    
    const res = await axios.get(`http://${publicIpAddress}`);
    let region = res.data.region;
    let zone = res.data.availability_zone;
    let private_ipv4 = res.data.private_ipv4;

    assert.equal(publicInstance.PrivateIpAddress, private_ipv4);
    assert.equal(publicInstance.Placement.AvailabilityZone, zone);
    assert.equal(AWS_CONFIG.region, region);
});