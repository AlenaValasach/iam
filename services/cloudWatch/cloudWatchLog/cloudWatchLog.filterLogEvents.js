const { DescribeLogGroupsCommand, FilterLogEventsCommand } = require("@aws-sdk/client-cloudwatch-logs");
const { CloudWatchLogsClientBase } = require("./cloudWatchLog.base");
var moment = require('moment'); 

class CloudWatchClientFilterLogEvents extends CloudWatchLogsClientBase
{
    async getFilterLogEvents(logGroupName, nextToken, time)
    {
        const input = { 
            logGroupName : logGroupName,
            nextToken: nextToken,
            startTime: time,
        };

        const command = new FilterLogEventsCommand(input);
        const response = await this.client.send(command);

        return response;
    }

    async getLogEvent(logGroupName, startDate)
    {
        let logEvents = [];
        let nextToken;
    
        const time = moment(startDate).milliseconds();
    
        do {
           const logEventsData = await this.getFilterLogEvents(logGroupName, nextToken, time); 
    
           logEvents = [...logEvents, ...logEventsData.events];
           nextToken = logEventsData.nextToken;
        } 
        while (nextToken);
    
        return logEvents;
    }
}

module.exports = { CloudWatchClientFilterLogEvents }