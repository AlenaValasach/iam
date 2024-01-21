const { CloudWatchClientBase } = require("./cloudWatch.base");
const { ListMetricsCommand } = require("@aws-sdk/client-cloudwatch");

class CloudWatchClientListMetrics extends CloudWatchClientBase
{
    async getListMetrics(namespace, instance)
    {
        const input = { 
            Namespace: namespace,
            Dimensions: [
              {
                Name: "InstanceId",
                Value: instance,
              },
            ],
        };

        const command = new ListMetricsCommand(input);
        const response = await this.client.send(command);

        return response.Metrics;
    }
}

module.exports = { CloudWatchClientListMetrics }