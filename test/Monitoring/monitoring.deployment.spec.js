
const { EC2ClientInstances } = require("../../services/ec2/ec2.instances");
const { CloudWatchClientLogGroups } = require("../../services/cloudWatch/cloudWatchLog/cloudWatchLog.logGroups");
const { CloudWatchClientListMetrics } = require("../../services/cloudWatch/cloudWatch.listMetrics");
const assert = require('node:assert/strict');
const { CloudWatchClientLogStreams } = require("../../services/cloudWatch/cloudWatchLog/cloudWatchLog.logStreams");
var moment = require('moment'); 
const { CloudTrailClientTrails } = require("../../services/cloudTrail/cloudTrail.trails");
const { AWS_CONFIG } = require('../../aws.config');
const { CloudTrailClientTrailStatus } = require("../../services/cloudTrail/cloudTrail.trailStatus");
const { CloudTrailClientTrail } = require("../../services/cloudTrail/cloudTrail.trail");
const { CloudTrailClientListTags } = require("../../services/cloudTrail/cloudTrial.listTags");

const logGroups_Message = '/var/log/messages';
const logGroups_CloudInit = '/var/log/cloud-init';
const logGroups_Cloudxserverless = '/aws/lambda/cloudxserverless';
const logGroups_Cloudxserverless_EventHandlerLambda = '/aws/lambda/cloudxserverless-EventHandlerLambda';

test("The application EC2 instance has CloudWatch integration", async () => {
    let ec2ClientInstances = new EC2ClientInstances();
    const instanceResponse = await ec2ClientInstances.getRunningInstances();

    let publicInstance = instanceResponse.Reservations[0].Instances[0];

    let cloudWatchClientListMetrics = new CloudWatchClientListMetrics(AWS_CONFIG.region);
    let metrics = await cloudWatchClientListMetrics.getListMetrics("AWS/EC2", publicInstance.InstanceId);

    assert.equal(metrics.length > 0, true, 'There is not any no metrics');

    let cloudWatchLogGroup = new CloudWatchClientLogGroups(AWS_CONFIG.region);
    let logGroupNames = await cloudWatchLogGroup.getAllLogGroupNamesByPrefix(logGroups_Cloudxserverless);

    assert.equal(logGroupNames.length > 0, true, `There is not any '${logGroups_Cloudxserverless}' Log Group`);

    let cloudWatchClientLogStreams = new CloudWatchClientLogStreams(AWS_CONFIG.region);
    const allLogStreamsData = await Promise.all(
        logGroupNames.map((groupName => cloudWatchClientLogStreams.getLogStreams(groupName))),
    );

    let isLogStreamsExist = allLogStreamsData.some(l => l.logStreams.length > 0);
    assert.equal(isLogStreamsExist, true, `There are not any '${logGroups_Cloudxserverless}' Log Streams`);
}); 

test("CloudInit logs should be collected in CloudWatch logs", async () => {
    let cloudWatchLogGroup = new CloudWatchClientLogGroups(AWS_CONFIG.region2);
    let logGroupNames = await cloudWatchLogGroup.getAllLogGroupNamesByPrefix(logGroups_CloudInit);

    assert.equal(logGroupNames.length > 0, true, `There is not any '${logGroups_CloudInit}' Log Group`);

    let cloudWatchClientLogStreams = new CloudWatchClientLogStreams(AWS_CONFIG.region2);
    const logStreamsData = await cloudWatchClientLogStreams.getLogStreams(logGroupNames[0]);

    const todayStreams = logStreamsData.logStreams.filter(l => {
        return moment(l.lastEventTimestamp).isSame(moment(), 'day');
    });

    assert.equal(todayStreams.length > 0, true, `There is not any '${logGroups_CloudInit}' Log Streams by today`);
}); 

test("The application messages should be collected in CloudWatch logs", async () => {
    let cloudWatchLogGroup = new CloudWatchClientLogGroups(AWS_CONFIG.region2);
    let logGroupNames = await cloudWatchLogGroup.getAllLogGroupNamesByPrefix(logGroups_Message);

    assert.equal(logGroupNames.length > 0, true, `There is not any '${logGroups_Message}' Log Group`);

    let cloudWatchClientLogStreams = new CloudWatchClientLogStreams(AWS_CONFIG.region2);
    const logStreamsData = await cloudWatchClientLogStreams.getLogStreams(logGroupNames[0]);

    assert.equal(logStreamsData.logStreams.length > 0, true, `There is not any '${logGroups_Message}' Log Streams by today`);
}); 

test("The event handler logs should be collected in CloudWatch logs", async () => {
    let cloudWatchLogGroup = new CloudWatchClientLogGroups(AWS_CONFIG.region);
    let logGroupNames = await cloudWatchLogGroup.getAllLogGroupNamesByPrefix(logGroups_Cloudxserverless_EventHandlerLambda);

    assert.equal(logGroupNames.length > 0, true, `There is not any '${logGroups_Cloudxserverless_EventHandlerLambda}' Log Group`);

    let cloudWatchClientLogStreams = new CloudWatchClientLogStreams(AWS_CONFIG.region);
    const allLogStreamsData = await Promise.all(
        logGroupNames.map((groupName => cloudWatchClientLogStreams.getLogStreams(groupName))),
    );

    let isLogStreamsExist = allLogStreamsData.some(l => l.logStreams.length > 0);
    assert.equal(isLogStreamsExist, true, `There are not any '${logGroups_Cloudxserverless_EventHandlerLambda}' Log Streams`);
}); 


test("CloudTrail is enabled for Serverless stack and collects logs about AWS services access", async () => {
    let cloudTrailClientTrails = new CloudTrailClientTrails(AWS_CONFIG.region);
    let responce = await cloudTrailClientTrails.getTrails();

    const trailData = responce.trailList.find(t => t.Name.includes('cloudxserverless-Trail'));
  
    assert.equal(trailData.HomeRegion, AWS_CONFIG.region);
    assert.equal(trailData.IncludeGlobalServiceEvents, true);
    assert.equal(trailData.IsMultiRegionTrail, true);
    assert.equal(trailData.IsOrganizationTrail, false);
    assert.equal(trailData.LogFileValidationEnabled, true);
  
    let cloudTrailClientTrailsStatus = new CloudTrailClientTrailStatus(AWS_CONFIG.region);
    const trailStatusData = await cloudTrailClientTrailsStatus.getTrailStatus(trailData.TrailARN);
  
    assert.equal(trailStatusData.IsLogging, true);
}); 

test("CloudWatch requirements (LogGroups)", async () => {
    let cloudWatchLogGroup = new CloudWatchClientLogGroups(AWS_CONFIG.region);
    let logGroupNames = await cloudWatchLogGroup.getAllLogGroups();

    const lambdaLogGroup = logGroupNames.find(g => g.includes(logGroups_Cloudxserverless_EventHandlerLambda));
    assert.notEqual(lambdaLogGroup, undefined, 'There is not any Log Group exists for Lambda function');

    const applicationLogGroup = logGroupNames.find(g => g.includes("/var/log/cloudxserverless-app"));
    assert.notEqual(applicationLogGroup, undefined, 'There is not any Log Group exists for application');

    let cloudWatchClientLogStreams = new CloudWatchClientLogStreams(AWS_CONFIG.region);
    let stream = await cloudWatchClientLogStreams.getLogStreams(applicationLogGroup);
    assert.equal(stream.logStreams.length > 0, true, `There are not any Log Streams for the application Log Group`);

    cloudWatchLogGroup = new CloudWatchClientLogGroups(AWS_CONFIG.region2);
    logGroupNames = await cloudWatchLogGroup.getAllLogGroups();
    
    const cloudInitLogGroup = logGroupNames.find(g => g.includes(logGroups_CloudInit));
    assert.notEqual(cloudInitLogGroup, undefined, 'There is not any Log Group exists for cloud-init');
}); 

test("CloudTrail trail requirements", async () => {
    let cloudTrailClientTrails = new CloudTrailClientTrails(AWS_CONFIG.region);
    let responce = await cloudTrailClientTrails.getTrails();

    const trail = responce.trailList.find(t => t.Name.includes('cloudxserverless-Trail'));
    assert.notEqual(trail, undefined, 'CloudTrail "cloudxserverless-Trail" does not exist');

    let cloudTrailClientTrail = new CloudTrailClientTrail(AWS_CONFIG.region);
    const trailData = await cloudTrailClientTrail.getTrail(trail.Name);
  
    assert.equal(trailData.Trail.IsMultiRegionTrail, true, 'CloudTrail is not set to multi-region');
    assert.equal(trailData.Trail.LogFileValidationEnabled, true, 'Log file validation is not enabled for CloudTrail');
    assert.equal(trail.KmsKeyId, undefined, 'the SSE-KMS encryption is enabled for a CloudTrail');

    let cloudTrailClientListTags = new CloudTrailClientListTags(AWS_CONFIG.region);
    const tagsResponce = await cloudTrailClientListTags.getListTags([trail.TrailARN]);

    const cloudxTag = await tagsResponce.ResourceTagList[0].TagsList.find(t => t.Key === "cloudx")
    assert.equal(cloudxTag.Value, "qa") 
});