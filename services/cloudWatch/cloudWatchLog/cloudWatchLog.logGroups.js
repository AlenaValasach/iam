const { DescribeLogGroupsCommand } = require("@aws-sdk/client-cloudwatch-logs");
const { CloudWatchLogsClientBase } = require("./cloudWatchLog.base");
var moment = require('moment'); 

class CloudWatchClientLogGroups extends CloudWatchLogsClientBase
{
    async getLogGroups(input)
    {
        const command = new DescribeLogGroupsCommand(input);
        const response = await this.client.send(command);

        return response
    }

    async getAllLogGroupNamesByPrefix(logGroupNamePrefix)
    {
/*         let logGroups = [];
        let logGroupsData = null;
        let input = {};

        do {
            logGroupsData = await this.getLogGroups(input);
            logGroups = [...logGroups, ...logGroupsData.logGroups];
            input = {nextToken: logGroupsData.nextToken}
        } 
        while (logGroupsData.nextToken); */

        let logGroups = await this.getAllLogGroupsByPrefix(logGroupNamePrefix);

        let x = logGroups.map(({ logGroupName }) => logGroupName);

        return x
    }

    async getAllLogGroupsByPrefix(logGroupNamePrefix)
    {
        let logGroups = [];
        let logGroupsData = null;
        let input = {};

        do {
            logGroupsData = await this.getLogGroups(input);
            logGroups = [...logGroups, ...logGroupsData.logGroups];
            input = {nextToken: logGroupsData.nextToken}
        } 
        while (logGroupsData.nextToken);

        return logGroups.filter((group) => group.logGroupName.includes(logGroupNamePrefix));
    }

    async getLatestLogGroupsByPrefix(logGroupNamePrefix)
    {
        let logGroups = await this.getAllLogGroupsByPrefix(logGroupNamePrefix);

        const x = logGroups.sort((a, b) => b.creationTime - a.creationTime);

        return x[0];
    }

    async getAllLogGroups()
    {
        let logGroups = [];
        let logGroupsData = null;
        let input = {};

        do {
            logGroupsData = await this.getLogGroups(input);
            logGroups = [...logGroups, ...logGroupsData.logGroups];
            input = {nextToken: logGroupsData.nextToken}
        } 
        while (logGroupsData.nextToken);

        let x = logGroups.map(({ logGroupName }) => logGroupName);

        return x
    }

    async getLogEvent(logGroupName, startDate)
    {
        let logEvents = [];
        let nextToken;
    
        const time = moment(startDate).milliseconds()
    
        do {
          const logEventsData = await cloudWatchLogsClient.send(
            new FilterLogEventsCommand({
              logGroupName,
              nextToken,
              startTime: time,
            }),
          );
    
          logEvents = [...logEvents, ...logEventsData.events];
          nextToken = logEventsData.nextToken;
        } while (nextToken);
    
        return logEvents;
    }
}

module.exports = { CloudWatchClientLogGroups }