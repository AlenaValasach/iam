const { DescribeDBInstancesCommand } = require("@aws-sdk/client-rds");
const { RDSClientBase } = require("./rds.base");

class RDSDBInstances extends RDSClientBase
{
    async getDBInstances()
    {
        const command = new DescribeDBInstancesCommand({});
        const response = await this.client.send(command);

        return response.DBInstances;
    }

    async getDBInstance(prefix)
    {
        const dbInstances = await this.getDBInstances();
        const dbInstance = dbInstances.find((rds) => rds.DBInstanceIdentifier.includes(prefix));

        return dbInstance;
    }
}

module.exports = { RDSDBInstances }