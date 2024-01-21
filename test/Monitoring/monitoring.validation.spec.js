const { CloudWatchClientLogGroups } = require("../../services/cloudWatch/cloudWatchLog/cloudWatchLog.logGroups");
const { SNSClientSubscribe } = require("../../services/sns/sns.Subscribe");
const { SNSClientListTopics } = require("../../services/sns/sns.listTopics");
const { uploadImage, deleteImage } = require("../../utilits/image.helper");
const { AWS_CONFIG } = require('../../aws.config');
const { EC2ClientInstances } = require("../../services/ec2/ec2.instances");
var moment = require('moment'); 
const { CloudWatchClientFilterLogEvents } = require("../../services/cloudWatch/cloudWatchLog/cloudWatchLog.filterLogEvents");
const assert = require('node:assert/strict');

describe('Monitoring and Logging', function () {
    let publicIpAddress;

    const logGroups_Cloudxserverless_App = '/var/log/cloudxserverless-app';
    const logGroups_Cloudxserverless_EventHandlerLambda = '/aws/lambda/cloudxserverless-EventHandlerLambda';

    beforeAll(async () => {
        let ec2ClientInstances = new EC2ClientInstances();
        const instanceResponse = await ec2ClientInstances.getRunningInstances();

        publicIpAddress = instanceResponse.Reservations[0].Instances[0].PublicIpAddress;
    });

    test("Cloudxserverless-EventHandlerLambda{unique_id} log group", async () => {
        const rmadomString = Math.random().toString(36).slice(2, 7);
        const endpoint = rmadomString+ "@me.com";

        const topicSns = "cloudxserverless-TopicSNSTopic";

        let snsClientListTopics = new SNSClientListTopics();
        const topicsResponce = await snsClientListTopics.getListTopics();

        let snsTopic = topicsResponce.Topics.find(t => t.TopicArn.includes(topicSns));
        
        assert.notEqual(snsTopic, undefined, "There is not cloudserverless SNS Topic.");

        let snsClientSubscribe = new SNSClientSubscribe();
        const subscribeResponce = await snsClientSubscribe.getSubscribe(snsTopic.TopicArn, endpoint);

        assert.equal(subscribeResponce.SubscriptionArn, "pending confirmation", 'SubscriptionArn is not correct');

        const startDate = moment();  // current date and time

        await uploadImage("flower.jpg", publicIpAddress);

        let cloudWatchLogGroup = new CloudWatchClientLogGroups(AWS_CONFIG.region);
        let latestLogGroup = await cloudWatchLogGroup.getLatestLogGroupsByPrefix(logGroups_Cloudxserverless_EventHandlerLambda);
    
        let cloudWatchClientFilterLogEvents = new CloudWatchClientFilterLogEvents(AWS_CONFIG.region);
        let logEvents = await cloudWatchClientFilterLogEvents.getLogEvent(latestLogGroup.logGroupName, startDate);

        let logEventsMessages = logEvents.map(l => l.message);

        assert.equal(logEventsMessages.some(m=> m.includes('object_key')), true);
        assert.equal(logEventsMessages.some(m => m.includes('object_type')), true);
        assert.equal(logEventsMessages.some(m => m.includes('last_modified')), true);
        assert.equal(logEventsMessages.some(m => m.includes('object_size')), true);
        assert.equal(logEventsMessages.some(m => m.includes('download_link')), true);
    }); 

    test("Cloudxserverless-app log group", async () => {
        const startDate = moment();  // current date and time

        await uploadImage("flower.jpg", publicIpAddress);
        await deleteImage(publicIpAddress);

        let cloudWatchLogGroup = new CloudWatchClientLogGroups(AWS_CONFIG.region);
        let latestLogGroup = await cloudWatchLogGroup.getLatestLogGroupsByPrefix(logGroups_Cloudxserverless_App);
    
        let cloudWatchClientFilterLogEvents = new CloudWatchClientFilterLogEvents(AWS_CONFIG.region);
        let logEvents = await cloudWatchClientFilterLogEvents.getLogEvent(latestLogGroup.logGroupName, startDate);

        let logEventsMessages = logEvents.map(l => l.message);

        assert.equal(logEventsMessages.some(m => m.includes('POST /api/image HTTP/1.1')), true);
        assert.equal(logEventsMessages.some(m => m.includes('GET /api/image HTTP/1.1')), true);
        assert.equal(logEventsMessages.some(m => m.includes('DELETE /api/image')), true);
    }); 
});