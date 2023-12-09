const assert = require('node:assert/strict');

let expectedVpcs = require('../data/vps.json');
const { EC2ClientVpcSubnets } = require('../../services/ec2/vpc/vpc.subnets');
const { EC2ClientVpcRouteTables } = require('../../services/ec2/vpc/vpc.routeTables');

test("The public subnet should be accessible from the internet by Internet Gateway", async () => {
    let ec2ClientVpcSubnets = new EC2ClientVpcSubnets();
    const publicSubnet = await ec2ClientVpcSubnets.getPublicVpcSubnet();

    let ec2ClientVpcRouteTables= new EC2ClientVpcRouteTables();
    const routeTables = await ec2ClientVpcRouteTables.getVpcRouteTablesBySubnetId(publicSubnet.SubnetId);

    //Routing to an internet gateway: Destination of 0.0.0.0/0 for IPv4 traffic or ::/0 for IPv6 traffic, and a target of the internet gateway ID (igw-xxxxxxxxxxxxxxxxx).
    const internetGateway = routeTables[0].Routes
        .find(r => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId.includes("igw-"));

    assert.notEqual(undefined, internetGateway, "Verify the public subnet is accessible from the internet by Internet Gateway.");
});

test("The public subnet should have access to the private subnet", async () => {
    let ec2ClientVpcSubnets = new EC2ClientVpcSubnets();
    const publicSubnet = await ec2ClientVpcSubnets.getPublicVpcSubnet();

    let ec2ClientVpcRouteTables= new EC2ClientVpcRouteTables();
    const routeTables = await ec2ClientVpcRouteTables.getVpcRouteTablesByVpcId(publicSubnet.VpcId);

    let localRoute = routeTables
        .find(t => t.Routes.find(r => r.DestinationCidrBlock === '10.0.0.0/16' && r.GatewayId === "local") !== undefined);

    assert.notEqual(undefined, localRoute, "Verify the public subnet should have access to the private subnet.");
});

test("The private subnet should have access to the internet via NAT Gateway", async () => {
    let ec2ClientVpcSubnets = new EC2ClientVpcSubnets();
    const privateSubnet = await ec2ClientVpcSubnets.getPrivateVpcSubnet();

    let ec2ClientVpcRouteTables= new EC2ClientVpcRouteTables();
    let routeTables = await ec2ClientVpcRouteTables.getVpcRouteTablesBySubnetId(privateSubnet.SubnetId);

    //Routing to a NAT device: Destination (0.0.0.0/0) Target (nat-gateway-id).
    let internetGateway = routeTables[0].Routes
        .find(r => r.DestinationCidrBlock === '0.0.0.0/0' && r.NatGatewayId.includes("nat-"));

    assert.notEqual(undefined, internetGateway, "Verify the private subnet is accessible from the internet by Internet Gateway.");
});

test("The private subnet should not be accessible from the public internet.", async () => {
    let ec2ClientVpcSubnets = new EC2ClientVpcSubnets();
    const privateSubnet = await ec2ClientVpcSubnets.getPrivateVpcSubnet();

    let ec2ClientVpcRouteTables= new EC2ClientVpcRouteTables();
    const routeTables = await ec2ClientVpcRouteTables.getVpcRouteTablesBySubnetId(privateSubnet.SubnetId);

    //Routing to an internet gateway: Destination of 0.0.0.0/0 for IPv4 traffic or ::/0 for IPv6 traffic, and a target of the internet gateway ID (igw-xxxxxxxxxxxxxxxxx).
    const internetGateway = routeTables[0].Routes
    .find(r => r.DestinationCidrBlock === '0.0.0.0/0' && Object.keys(r).includes("GatewayId"));

    assert.equal(undefined, internetGateway, "Verify the private subnet should not be accessible from the public internet.");
});