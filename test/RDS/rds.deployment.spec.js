const assert = require('node:assert/strict');
const mysql = require("mysql2/promise");
const { RDSDBInstances } = require('../../services/rds/rds.dbInstances');
const { RDS_DB_CONFIG } = require('../../rds.db.config');

test("The applications DB deployed in the private subnet and should be accessible only from the application's public subnet, but not from the public internet", async () => {
    let rdsDbInstances = new RDSDBInstances();
    const dbInstance = await rdsDbInstances.getDBInstance("cloudximage-databasemysqlinstanced");
    const rdsEndpoint = dbInstance.Endpoint.Address;
    const subnets = dbInstance.DBSubnetGroup.Subnets;

    assert.equal(dbInstance.PubliclyAccessible, false, "Db instance: PubliclyAccessible should be false");
    
    assert.equal(dbInstance.DBSubnetGroup.VpcId.startsWith("vpc-"), true);
    assert.equal(dbInstance.DBSubnetGroup.DBSubnetGroupDescription, "Subnet group for MySQLInstance database");

    assert.equal(subnets.length > 0, true, "There are not any Subnets");

    const areSubnetsActive = subnets.every(s => s.SubnetStatus === "Active");
    assert.equal(areSubnetsActive, true, "Not all Subnets are Active");

    const dbUsername = RDS_DB_CONFIG.username;
    const dbPassword = RDS_DB_CONFIG.password;
    const dbName = RDS_DB_CONFIG.dbName;
    const dbPort= RDS_DB_CONFIG.dbPort;

    const connection = undefined;

    try {
        connection = await mysql.createConnection({
            host: rdsEndpoint,
            database: dbName,
            user: dbUsername,
            password: dbPassword,
            port: Number(dbPort),
        });

        assert.fail("Should not be succesfully connected to DB");
    } 
    catch (error) {
        assert.equal(error.message,'connect ETIMEDOUT');
    } 
    finally {
        if (connection && connection.end) {
            await connection.end();
        }
    };
}); 

test("RDS Instance requirements", async () => {
    let rdsDbInstances = new RDSDBInstances();
    const dbInstance = await rdsDbInstances.getDBInstance("cloudximage-databasemysqlinstanced");

    assert.equal(dbInstance.DBInstanceClass, 'db.t3.micro');
    assert.equal(dbInstance.MultiAZ, false);
    assert.equal(dbInstance.AllocatedStorage, 100);
    assert.equal(dbInstance.StorageType, 'gp2');
    assert.equal(dbInstance.StorageEncrypted, false);
    assert.equal(dbInstance.Engine, 'mysql');
    assert.equal(dbInstance.EngineVersion, '8.0.28');

    let actualTags = dbInstance.TagList.map(t => t.Key);
    const isTagPresented = actualTags.some(t=> t.includes("cloudx"))
    assert.equal(isTagPresented, true);
}); 
