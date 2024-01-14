const { DynamoDBClientTables } = require("../../services/dynamoDb/dynamoDb.listTables");
const assert = require('node:assert/strict');
const { DynamoDBClientTable } = require("../../services/dynamoDb/dynamoDb.table");
const { uploadImage, deleteImage, deleteImages } = require("../../utilits/image.helper");
const { EC2ClientInstances } = require("../../services/ec2/ec2.instances");
const { DynamoDBClientScan } = require("../../services/dynamoDb/dynamoDb.scan");
const { SNSClientListTopics } = require("../../services/sns/sns.listTopics");
const { SNSClientSubscribe } = require("../../services/sns/sns.Subscribe");
const { GMAIL_CONFIG } = require('../../gmail.config');
const { GmailService } = require("../../utilits/gmail.service");
const { SNSClientConfirmSubscription } = require("../../services/sns/sns.confirmSubscription");
const { SNSClientListSubscriptionsByTopic } = require("../../services/sns/sns.listSubscriptionsByTopic");
const { SNSClientListSubscriptions } = require("../../services/sns/sns.listSubscriptions");
const { SQSClientListQueues } = require("../../services/sqs/sqs.listQueues");
const { SQSClientSendMessage } = require("../../services/sqs/sqs.sendMessage");
const { LambdaClientListEventSourceMappings } = require("../../services/lambda/lambda.listEventSourceMappings");
const { LambdaClientListFunctions } = require("../../services/lambda/lambda.listFunctions");
const { IAMRole } = require("../../services/iam/iam.role");
const { LambdaClientFunctionConfiguration } = require("../../services/lambda/lambda.functionConfiguration");
const { LambdaClientListTags } = require("../../services/lambda/lambda.listTags");
const { DynamoDBClientTimeToLive } = require("../../services/dynamoDb/dynamoDb.timeToLive");
const { DynamoDBClientListTagsOfResource } = require("../../services/dynamoDb/dynamoDb.listTagsOfResource");
const { SNSClientUnsubscribe } = require("../../services/sns/sns.unsubscribe");
const base64 = require('js-base64');

let dynamoDBTableName;
let publicIpAddress;
let subscriptionArn;
let snsTopic;

let email= GMAIL_CONFIG.email;

const topicSns = "cloudxserverless-TopicSNSTopic";
const queueSQS = "cloudxserverless-QueueSQSQueue";
const lambdaFunction = "cloudxserverless-EventHandlerLambda"
const dynamoDbTable = "cloudxserverless-DatabaseImagesTable"

describe.skip('Deplayment validation', function () {
    test("A lambda function is subscribed to the SQS queue to filter and put event messages to the SNS topic", async () => {
        let lambdaClientListEventSourceMappings = new LambdaClientListEventSourceMappings();
        const responce = await lambdaClientListEventSourceMappings.getListEventSourceMappings();

        const item = responce.find(m => m.FunctionArn.includes(lambdaFunction));
      
        assert.equal(item.EventSourceArn.includes(queueSQS), true, `EventSourceArn is not correct`);
        assert.equal(item.State, 'Enabled', `State is not correct`);
        assert.equal(item.StateTransitionReason, 'USER_INITIATED', `StateTransitionReason is not correct`);
        assert.notEqual(item.UUID, undefined, `EventSourceMappings.UUID is not correct`);
    }); 

    test("The application should have access to the S3 bucket, the DynamoDB table, the SQS queue and the SNS topic instance via IAM roles", async () => {
        let iamRole =  new IAMRole();
        let roles = await iamRole.getRoles();

        const isAWSServiceRoleForApplicationExist = roles.Roles.find(r => r.RoleName === "AWSServiceRoleForApplicationAutoScaling_DynamoDBTable");
        const isAWSServiceRoleForRDSExist = roles.Roles.find(r => r.RoleName === "AWSServiceRoleForRDS");
        const isAppInstanceInstanceRoleExist = roles.Roles.find(r => r.RoleName.includes("cloudxserverless-AppInstanceInstanceRole"));
        const isCustomCDKBucketDeploymentExist = roles.Roles.find(r => r.RoleName.includes("cloudxserverless-CustomCDKBucketDeployment"));
        const isEventHandlerLambdaRoleExist = roles.Roles.find(r => r.RoleName.includes("cloudxserverless-EventHandlerLambdaRole"));
        const isCustomS3AutoDeleteObjectsCustomExist = roles.Roles.find(r => r.RoleName.includes("cloudxserverless-CustomS3AutoDeleteObjectsCustom"));
        const isLogRetentionExist = roles.Roles.find(r => r.RoleName.includes("cloudxserverless-LogRetention"));

        assert.notEqual(isAWSServiceRoleForApplicationExist, undefined);
        assert.notEqual(isAWSServiceRoleForRDSExist, undefined);
        assert.notEqual(isAppInstanceInstanceRoleExist, undefined);
        assert.notEqual(isCustomCDKBucketDeploymentExist, undefined);
        assert.notEqual(isEventHandlerLambdaRoleExist, undefined);
        assert.notEqual(isCustomS3AutoDeleteObjectsCustomExist, undefined);
        assert.notEqual(isLogRetentionExist, undefined);
    });

    test("AWS Lambda requirements", async () => {
        let lambdaClientListFunctions = new LambdaClientListFunctions();
        const responceFunctions = await lambdaClientListFunctions.getFunctions();

        let lambdaFunc = responceFunctions.Functions.find(l => l.FunctionName.includes(lambdaFunction));
        let lambdaFunctionName = lambdaFunc.FunctionName;

        let lambdaClientFunctionConfiguration = new LambdaClientFunctionConfiguration();
        const responce = await lambdaClientFunctionConfiguration.getFunctionConfiguration(lambdaFunctionName);

        assert.equal(responce.MemorySize, 128, `Lambda MemorySize is not correct`);
        assert.equal(responce.Timeout, 3, `Lambda Timeout is not correct`);
        assert.equal(responce.EphemeralStorage.Size, 512, `Lambda Size is not correct`);
        assert.equal(responce.Environment.Variables.TOPIC_ARN.includes(topicSns), true, `Lambda TOPIC_ARN is not correct`);
        assert.equal(responce.LoggingConfig.LogFormat, 'Text', `Lambda LogFormat is not correct`);
        assert.equal(responce.LoggingConfig.LogGroup.includes(lambdaFunction), true, `Lambda LogGroup is not correct`);

        let lambdaClientListTags = new LambdaClientListTags();
        const tagsResponce = await lambdaClientListTags.getListTags(responce.FunctionArn);

        let isTagExist = Object.hasOwn(tagsResponce.Tags, 'cloudx')
        assert.equal(isTagExist, true, "Encryption should be enable")
        assert.equal(tagsResponce.Tags.cloudx, "qa");
    });
}); 

describe.skip('DynamoDB deployment validation', function () {
    beforeAll(async () => {
        let ec2ClientInstances = new EC2ClientInstances();
        const instanceResponse = await ec2ClientInstances.getRunningInstances();

        publicIpAddress = instanceResponse.Reservations[0].Instances[0].PublicIpAddress;

        let dynamoDbTables = new DynamoDBClientTables();
        const tables = await dynamoDbTables.getTables();
    
        dynamoDBTableName = tables.TableNames.find(t => t.includes(dynamoDbTable));

        assert.notEqual(dynamoDBTableName, undefined, 'Dynamo Db is not found.');
    });

    afterAll(async () => {
        await deleteImages(publicIpAddress);
    });

    test("The application database is replaced with a DynamoDB table.", async () => {
        let dynamoDbTable = new DynamoDBClientTable();
        const table = await dynamoDbTable.getTable(dynamoDBTableName);

        assert.equal(table.TableArn.includes(dynamoDBTableName), true, `TableArn is not correct`);
        assert.notEqual(table.TableId, undefined, `TableId is not correct`);
        assert.equal(table.TableName.includes(dynamoDBTableName), true, `TableName is not correct`);
        assert.equal(table.TableStatus, 'ACTIVE', `TableStatus is not correct`);
    }); 

    test("The DynamoDB table should store the following image metadata information", async () => {
        await uploadImage("flower.jpg", publicIpAddress)

        let dynamoDbScan = new DynamoDBClientScan();
        const responce = await dynamoDbScan.scan(dynamoDBTableName);

        let isCreatedAtExist = Object.hasOwn(responce.Items[0], 'created_at');
        let isIdExist = Object.hasOwn(responce.Items[0], 'id');
        let isLastModifiedExist = Object.hasOwn(responce.Items[0], 'last_modified');
        let isObjectKeyExist = Object.hasOwn(responce.Items[0], 'object_key');
        let isObjectSizeExist = Object.hasOwn(responce.Items[0], 'object_size');
        let isObjectTypeExist = Object.hasOwn(responce.Items[0], 'object_type');

        assert.equal(isCreatedAtExist, true);
        assert.equal(isIdExist, true,);
        assert.equal(isLastModifiedExist, true);
        assert.equal(isObjectKeyExist, true,);
        assert.equal(isObjectSizeExist, true);
        assert.equal(isObjectTypeExist, true,);
    }); 

    test("DynamoDB Table requirements", async () => {
        let dynamoDBClientTable = new DynamoDBClientTable();
        const responce = await dynamoDBClientTable.getTable(dynamoDBTableName);

        assert.equal(responce.ProvisionedThroughput.ReadCapacityUnits, 5);
        assert.equal(responce.ProvisionedThroughput.WriteCapacityUnits, 1);
        assert.equal(responce.GlobalSecondaryIndexes, undefined);

        let dynamoDBClientTimeToLive = new DynamoDBClientTimeToLive();
        const responceTimeToLive = await dynamoDBClientTimeToLive.getTimeToLive(dynamoDBTableName);

        assert.equal(responceTimeToLive.TimeToLiveDescription.TimeToLiveStatus, "DISABLED");

        let dynamoDBClientTags = new DynamoDBClientListTagsOfResource();
        const tagsResponce = await dynamoDBClientTags.getListTagsOfResource(responce.TableArn);

        let actualTags = tagsResponce.Tags.map(t => t.Key);
        const isTagPresented = actualTags.some(t=> t.includes("cloudx"))
        assert.equal(isTagPresented, true);
    });
});

describe('Subscription deployment validation', function () {
    beforeAll(async () => {
        let ec2ClientInstances = new EC2ClientInstances();
        const instanceResponse = await ec2ClientInstances.getRunningInstances();

        publicIpAddress = instanceResponse.Reservations[0].Instances[0].PublicIpAddress;
        
        let snsClientListTopics = new SNSClientListTopics();
        const topicsResponce = await snsClientListTopics.getListTopics();
    
        snsTopic = topicsResponce.Topics.find(t => t.TopicArn.includes(topicSns));

        assert.notEqual(snsTopic, undefined, "There is not cloudximage SNS Topic.");

        // Create subscription
        let snsClientSubscribe = new SNSClientSubscribe();
        const subscribeResponce = await snsClientSubscribe.getSubscribe(snsTopic.TopicArn, email);

        assert(subscribeResponce.SubscriptionArn, "pending confirmation", 'SubscriptionArn is not correct');
    });

    afterAll(async () => {
        if (subscriptionArn !== undefined)
        {
            // Unsubscribe
            let snsClientUnsubscribe = new SNSClientUnsubscribe();
            const unsubscribeResponce = await snsClientUnsubscribe.unsubscribe(subscriptionArn);
        }
    });

    test("The SNS topic is used to subscribe", async () => {
        const subject = 'AWS Notification - Subscription Confirmation';
        let gmailService = new GmailService();
        let message = await gmailService.getLatestMessage();
        let messageDetails = await gmailService.getMessageDetails(message.id);

        let expectedSubject = messageDetails.payload.headers.find(x => x.name === "Subject").value;

        assert.equal(subject, expectedSubject, `There are not message where Subject=${subject}`);

        let body = base64.decode(messageDetails.payload.body.data);
        const token = body.match(/Token=([^&]*)/)[1];

        // Confirm subscription
        let snsClientConfirmSubscription = new SNSClientConfirmSubscription();
        const confirmedSubscribeResponce = await snsClientConfirmSubscription.confirmSubscription(snsTopic.TopicArn, token);

        let snsClientListSubscriptionsByTopic = new SNSClientListSubscriptionsByTopic();
        const listSubscriptionsByTopicResponce = await snsClientListSubscriptionsByTopic.getListSubscriptionsByTopic(snsTopic.TopicArn);

        assert.equal(listSubscriptionsByTopicResponce.Subscriptions.length> 0, true, "There are not any subscriptionst");

        const subscription = listSubscriptionsByTopicResponce.Subscriptions.find(e => e.Endpoint === email);

        subscriptionArn = subscription.SubscriptionArn;

        assert.equal(subscription.Endpoint, email, 'Endpoint is not correct');
        assert.equal(subscription.SubscriptionArn.includes(topicSns), true, "SubscriptionArn is not correct");
        assert.equal(subscription.Protocol, "email", "Protocol is not correct");
        assert.equal(subscription.TopicArn, snsTopic.TopicArn, "TopicArn is not correct");
    }); 

    test("List existing subscriptions", async () => {
        let snsClientSubscriptions = new SNSClientListSubscriptions();
        const responce = await snsClientSubscriptions.getListSubscriptions();
    
        assert.equal(responce.Subscriptions.length > 0, true, "There are not any subscription");
    }); 

    test("Send messages to subscribers about upload and delete image events", async () => {
        await uploadImage("flower.jpg", publicIpAddress)

        const subject = 'AWS Notification Message';
        let gmailService = new GmailService();

        let message = await gmailService.getLatestMessage();
        let messageDetails = await gmailService.getMessageDetails(message.id);
        let expectedSubject = messageDetails.payload.headers.find(x => x.name === "Subject").value;
        let body = base64.decode(messageDetails.payload.body.data);

        // Assert image metadata information and a download link
        assert.equal(subject, expectedSubject, `There are not message where Subject=${subject}`);
        assert.equal(body.includes('event_type: upload'), true);
        assert.equal(body.includes('object_key: images/'), true);
        assert.equal(body.includes('object_type: binary/octet-stream'), true);
        assert.equal(body.includes('last_modified:'), true);
        assert.equal(body.includes('object_size:'), true);
        assert.equal(body.includes('download_link:'), true);

        await deleteImage(publicIpAddress);
        
        message = await gmailService.getLatestMessage();
        messageDetails = await gmailService.getMessageDetails(message.id);
        expectedSubject = messageDetails.payload.headers.find(x => x.name === "Subject").value;
        body = base64.decode(messageDetails.payload.body.data);

        // Assert image metadata information and a download link
        assert.equal(subject, expectedSubject, `There are not message where Subject=${subject}`);
        assert.equal(body.includes('event_type: delete'), true);
    }); 

    test("The application uses an SQS queue to publish event messages.", async () => {
        let messageBody = "Test Message";

        let sqsClientListQueues = new SQSClientListQueues();
        const listQueuesResponce = await sqsClientListQueues.getListQueues();
    
        let queueUrl = listQueuesResponce.QueueUrls.find(q => q.includes(queueSQS));

        let sqsClientSendMessage= new SQSClientSendMessage();
        const sendMessageResponce = await sqsClientSendMessage.getSendMessage(queueUrl, messageBody);

        let isMessageIdExist = Object.hasOwn(sendMessageResponce, 'MessageId');
        let isMessageBodyExist = Object.hasOwn(sendMessageResponce, 'MD5OfMessageBody')
    
        assert.equal(isMessageIdExist, true, "An attribute containing the MessageId of the message sent to the queue.");
        assert.equal(isMessageBodyExist, true,);
    }); 
});