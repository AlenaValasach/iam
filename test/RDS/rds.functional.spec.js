const assert = require('node:assert/strict');
const mysql = require("mysql2/promise");
const { RDSDBInstances } = require('../../services/rds/rds.dbInstances');
const { RDS_DB_CONFIG } = require('../../rds.db.config');
const { EC2ClientInstances } = require('../../services/ec2/ec2.instances');
const { createTunnel}  = require('tunnel-ssh');
const fs = require('fs-extra');
const FormData = require('form-data');
const axios = require('axios');
const { readFileSync } = require('fs');
var moment = require('moment'); // require

let imageId = "";

test("The uploaded image metadata is stored in MySQL RDS database", async () => {
    let dbUsername = RDS_DB_CONFIG.username;
    let dbPassword = RDS_DB_CONFIG.password;
    let dbName = RDS_DB_CONFIG.dbName;
    let dbPort= RDS_DB_CONFIG.dbPort;

    let ec2ClientInstances = new EC2ClientInstances();
    const response = await ec2ClientInstances.getRunningInstances();

    let publicInstance = response.Reservations[0].Instances[0];
    let publicIpAddress = publicInstance.PublicIpAddress;

    await uploadImage("flower.jpg", `http://${publicIpAddress}/api/image`)

    // Create SSH tunnel to MySQL RDS
    await createSshTunnel(publicIpAddress, dbPort);

    let connectionToDb = undefined;

    try {
        connectionToDb = await mysql.createConnection({
            host: '127.0.0.1',
            user: dbUsername,
            password: dbPassword,
            port: 3306,
            database: dbName,
        });

        const tables = await connectionToDb.query('SHOW TABLES');
        let tableName = tables[0][0].Tables_in_cloudximages;

        assert.equal(tableName, "images");

        const imagesCount = await connectionToDb.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = imagesCount[0][0].count;

        assert.equal(rowCount > 0, true, "There is not any images in DB");
 
        const id = await connectionToDb.query(`select id FROM ${tableName}`);
        let index = id[0].findIndex(i => i.id === imageId);

        const columns = await connectionToDb.query(`SHOW COLUMNS FROM ${tableName}`);
        const object_key = await connectionToDb.query(`select object_key FROM ${tableName}`);
        const object_type = await connectionToDb.query(`select object_type FROM ${tableName}`);
        const object_size = await connectionToDb.query(`select object_size FROM ${tableName}`);
        const last_modified = await connectionToDb.query(`select last_modified FROM ${tableName}`);

        assert.equal(object_key[0][index].object_key.includes("flower.jpg"), true);
        assert.equal(object_type[0][index].object_type, "binary/octet-stream");
        assert.equal(object_size[0][index].object_size, 1434577);

        const lastModified = last_modified[0][index].last_modified;

        moment(lastModified).isSame(moment(), 'day');
    } 
    catch (error) {
        console.log(error);
        throw new Error(error);
    } 
    finally {
        if (connectionToDb && connectionToDb.end) {
            await connectionToDb.end();
        }
    };
}); 

test("The image metadata is returned by {base URL}/image/{image_id} GET request", async () => {
    let ec2ClientInstances = new EC2ClientInstances();
    const response = await ec2ClientInstances.getRunningInstances();

    let publicInstance = response.Reservations[0].Instances[0];
    let publicIpAddress = publicInstance.PublicIpAddress;

    const res = await axios.get(`http://${publicIpAddress}/api/image/${imageId}`);

    assert.equal(res.status, 200);

    assert.equal(res.data.object_key.includes("flower.jpg"), true);
    assert.equal(res.data.object_type, "binary/octet-stream");
    assert.equal(res.data.object_size, 1434577);

    const lastModified = res.data.last_modified;
    moment(lastModified).isSame(moment(), 'day');
}); 

test("The image metadata for the deleted image is also deleted from the database", async () => {
    let dbUsername = RDS_DB_CONFIG.username;
    let dbPassword = RDS_DB_CONFIG.password;
    let dbName = RDS_DB_CONFIG.dbName;
    let dbPort= RDS_DB_CONFIG.dbPort;

    let ec2ClientInstances = new EC2ClientInstances();
    const response = await ec2ClientInstances.getRunningInstances();

    let publicInstance = response.Reservations[0].Instances[0];
    let publicIpAddress = publicInstance.PublicIpAddress;

    const deleteResponce = await axios.delete(`http://${publicIpAddress}/api/image/${imageId}`);
    
    assert.equal(deleteResponce.status, 200);

    // Create SSH tunnel to MySQL RDS
    await createSshTunnel(publicIpAddress, dbPort);

    let connectionToDb = undefined;

    try {
        connectionToDb = await mysql.createConnection({
            host: '127.0.0.1',
            user: dbUsername,
            password: dbPassword,
            port: 3306,
            database: dbName,
        });

        const tables = await connectionToDb.query('SHOW TABLES');
        let tableName = tables[0][0].Tables_in_cloudximages;

        assert.equal(tableName, "images");

        const id = await connectionToDb.query(`select id FROM ${tableName}`);

        assert.equal(id[0].find(i => i.id === imageId), undefined, "There is image in DB.");
    } 
    catch (error) {
        console.log(error);
        throw new Error(error);
    } 
    finally {
        if (connectionToDb && connectionToDb.end) {
            await connectionToDb.end();
        }
    };
}); 

async function uploadImage(imageFile, url)
{
    const stream = fs.createReadStream(imageFile);

    const formData = new FormData();
    formData.append('upfile', stream);

    const formHeaders = formData.getHeaders();
    const headers =
    {
        ...formHeaders,
    };

    const res = await axios.post(url, formData, { headers });

    assert.equal(res.status, 200);

    imageId = res.data.id;
}

async function createSshTunnel(publicIpAddress, dbPort)
{
    const privateKey = readFileSync("cloudximage-us-east-1.pem", 'utf8');
    const sshOptions =  {
        host: publicIpAddress,
        username: 'ec2-user',
        privateKey: privateKey,
        port: 22,
    };

    const rdsDbInstances = new RDSDBInstances();
    const dbInstance = await rdsDbInstances.getDBInstance("cloudximage-databasemysqlinstanced");
    const rdsEndpoint = dbInstance.Endpoint.Address;

    const forwardOptions = {
        srcAddr: '127.0.0.1',
        srcPort: 3306,
        dstAddr: rdsEndpoint,
        dstPort: Number(dbPort),
      };

      const autoClose = true;
      const tunnelOptions = {
        autoClose,
      };

      const port = 3306;
      const serverOptions = {
        port,
      };

      let [server, conn] = await createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions);

    server.on('connection', (connection) => {
        console.log('new connection');
    });

    console.log(`server listen on ${server.address().port}`)
}