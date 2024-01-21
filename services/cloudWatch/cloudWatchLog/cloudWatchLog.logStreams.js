const { DescribeLogStreamsCommand, CloudWatchLogsClient } = require("@aws-sdk/client-cloudwatch-logs");
const { CloudWatchLogsClientBase } = require("./cloudWatchLog.base");

class CloudWatchClientLogStreams extends CloudWatchLogsClientBase
{
    async getLogStreams(logGroupName)
    {
        const input = { 
            logGroupName : logGroupName
        };

        const command = new DescribeLogStreamsCommand(input);
        const response = await this.client.send(command);

        return response;
    }
}

module.exports = { CloudWatchClientLogStreams }