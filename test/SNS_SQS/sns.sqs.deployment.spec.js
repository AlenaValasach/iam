const assert = require('node:assert/strict');

const { EC2ClientVpcs } = require('../../services/ec2/vpc/vpc.vpcs');
const { EC2ClientInstances } = require('../../services/ec2/ec2.instances');
const { EC2ClientVpcSubnets } = require('../../services/ec2/vpc/vpc.subnets');

const { Client } = require('ssh2');
const { readFileSync } = require('fs');
const { AWS_CONFIG } = require('../../aws.config');
const { SNSClientListTopics } = require('../../services/sns/sns.listTopics');
const { SNSClientSubscribe } = require('../../services/sns/sns.Subscribe');
const { SNSClientConfirmSubscription } = require('../../services/sns/sns.confirmSubscription');
const { SNSClientListSubscriptionsByTopic } = require('../../services/sns/sns.listSubscriptionsByTopic');
const { SNSClientUnsubscribe } = require('../../services/sns/sns.unsubscribe');
const { SNSClientGetSubscriptionAttributes } = require('../../services/sns/sns.getSubscriptionAttributes');
const { SNSClientListSubscriptions } = require('../../services/sns/sns.listSubscriptions');
const { SQSClientListQueues } = require('../../services/sqs/sqs.listQueues');
const { SQSClientSendMessage } = require('../../services/sqs/sqs.sendMessage');
const { SNSClientPublish } = require('../../services/sns/sns.publish');
const { IAMInstanceProfile } = require('../../services/iam/iam.instanceProfile');
const { SNSClientTopicAttributes } = require('../../services/sns/sns.topicAttributes');
const { SNSClientListTags } = require('../../services/sns/sns.listTagsForResource');
const { SQSClientListQueueTags } = require('../../services/sqs/sqs.listQueueTags');

const base64 = require('js-base64');

const { GmailService } = require('../../utilits/gmail.service');

const { GMAIL_CONFIG } = require('../../gmail.config');

test("The application uses an SNS topic to subscribe and unsubscribe users", async () => {
    const email = GMAIL_CONFIG.email;

    let snsClientListTopics = new SNSClientListTopics();
    const topicsResponce = await snsClientListTopics.getListTopics();

    let snsTopic = topicsResponce.Topics.find(t => t.TopicArn.includes("cloudximage-TopicSNSTopic"));
    
    assert.notEqual(snsTopic, undefined, "There is not cloudximage SNS Topic.");

    let snsClientSubscribe = new SNSClientSubscribe();
    const subscribeResponce = await snsClientSubscribe.getSubscribe(snsTopic.TopicArn, email);

    assert(subscribeResponce.SubscriptionArn, "pending confirmation", 'SubscriptionArn is not correct');
    
    sleep(3000);

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

    assert.equal(subscription.SubscriptionArn.includes('cloudximage-TopicSNSTopic'), true, "SubscriptionArn is not correct");
    assert.equal(subscription.Protocol, "email", "Protocol is not correct");
    assert.equal(subscription.TopicArn, snsTopic.TopicArn, "TopicArn is not correct");

    // Unsubscribe
    let snsClientUnsubscribe = new SNSClientUnsubscribe();
    const unsubscribeResponce = await snsClientUnsubscribe.unsubscribe(subscription.SubscriptionArn);

    try 
    {
        let snsClientSubscriptionAttributes = new SNSClientGetSubscriptionAttributes();
        await snsClientSubscriptionAttributes.getSubscriptionAttributes(subscription.SubscriptionArn);

        assert.fail("Subscription is presented after performing unsubscribe.");
    } 
    catch (error) 
    {
        assert.equal(error.message, "Subscription does not exist");
    }
}); 

test("List existing subscriptions", async () => {
    const rmadomString = Math.random().toString(36).slice(2, 7);
    const endpoint = rmadomString+ "@me.com";

    let snsClientListTopics = new SNSClientListTopics();
    const topicsResponce = await snsClientListTopics.getListTopics();

    let snsTopic = topicsResponce.Topics.find(t => t.TopicArn.includes("cloudximage-TopicSNSTopic"));
    
    assert.notEqual(snsTopic, undefined, "There is not cloudximage SNS Topic.");

    let snsClientSubscribe = new SNSClientSubscribe();
    const subscribeResponce = await snsClientSubscribe.getSubscribe(snsTopic.TopicArn, endpoint);

    assert(subscribeResponce.SubscriptionArn, "pending confirmation", 'SubscriptionArn is not correct');

    let snsClienListSubscriptions = new SNSClientListSubscriptionsByTopic();
    const listSubscriptionsResponce = await snsClienListSubscriptions.getListSubscriptionsByTopic(snsTopic.TopicArn);

    assert.equal(listSubscriptionsResponce.Subscriptions.length > 0, true, "There are not any subscriptions.");

    let isSubscriptionPresented = listSubscriptionsResponce.Subscriptions.find(s => s.Endpoint.includes(endpoint));
    
    assert.notEqual(isSubscriptionPresented, undefined);
}); 

test("Send messages to SQS queue", async () => {
    let messageBody = "Test Message";

    let sqsClientListQueues = new SQSClientListQueues();
    const listQueuesResponce = await sqsClientListQueues.getListQueues();

    let queueUrl = listQueuesResponce.QueueUrls.find(q => q.includes("cloudximage-QueueSQSQueue"));
    
    assert.notEqual(queueUrl, undefined, "There is not cloudximage SQS Queue.");

    let sqsClientSendMessage= new SQSClientSendMessage();
    const sendMessageResponce = await sqsClientSendMessage.getSendMessage(queueUrl, messageBody);

    let isMessageIdExist = Object.hasOwn(sendMessageResponce, 'MessageId');
    let isMessageBodyExist = Object.hasOwn(sendMessageResponce, 'MD5OfMessageBody')

    assert.equal(isMessageIdExist, true, "An attribute containing the MessageId of the message sent to the queue.");
    assert.equal(isMessageBodyExist, true,);
}); 

test("Publish messages to SNS topic", async () => {
    let messageBody = "Test Message";

    let snsClientListTopics = new SNSClientListTopics();
    const topicsResponce = await snsClientListTopics.getListTopics();

    let snsTopic = topicsResponce.Topics.find(t => t.TopicArn.includes("cloudximage-TopicSNSTopic"));
    
    assert.notEqual(snsTopic, undefined, "There is not cloudximage SNS Topic.");

    let snsClientPublish= new SNSClientPublish();
    const publishResponce = await snsClientPublish.publish(snsTopic.TopicArn, messageBody);

    let isMessageIdExist = Object.hasOwn(publishResponce, 'MessageId')

    assert.equal(isMessageIdExist, true, "An attribute containing the MessageId of the message sent to SNS topic.");
}); 

test("IAM roles", async () => {
    let ec2ClientInstances = new EC2ClientInstances();
    const response = await ec2ClientInstances.getRunningInstances();

    let instanceId = response.Reservations[0].Instances[0].InstanceId;
    let instanceProfileArn = response.Reservations[0].Instances[0].IamInstanceProfile.Arn;

    let instanceProfileName = instanceProfileArn.split('/')[1];

    let iamInstanceProfile =  new IAMInstanceProfile();
    let instanceProfile = await iamInstanceProfile.getInstanceProfile(instanceProfileName);

    let roles = instanceProfile.InstanceProfile.Roles
    
    assert.equal(roles.length > 0, true, "EC2 Instance doesn't have any roles");
}); 

test("SNS topic requirements", async () => {
    let snsClientListTopics = new SNSClientListTopics();
    const topicsResponce = await snsClientListTopics.getListTopics();

    let snsTopic = topicsResponce.Topics.find(t => t.TopicArn.includes("cloudximage-TopicSNSTopic"));
    
    assert.notEqual(snsTopic, undefined, "There is not cloudximage SNS Topic.");

    let snsClientTopicAttributes = new SNSClientTopicAttributes();
    const topicAttributesResponce = await snsClientTopicAttributes.getTopicAttributes(snsTopic.TopicArn);

    assert.equal(topicAttributesResponce.Attributes.KmsMasterKeyId, undefined, "Encryption should be disable");

    let snsClientListTags = new SNSClientListTags();
    const tagsResponce = await snsClientListTags.getListTagsForResource(snsTopic.TopicArn);

    let actualTags = tagsResponce.Tags.map(t => t.Key);
    const isTagPresented = actualTags.some(t=> t.includes("cloudx"))
    assert.equal(isTagPresented, true);
}); 

test("SQS topic requirements", async () => {
    let sqsClientListQueues = new SQSClientListQueues();
    const listQueuesResponce = await sqsClientListQueues.getListQueues();

    let queueUrl = listQueuesResponce.QueueUrls.find(q => q.includes("cloudximage-QueueSQSQueue"));
    
    assert.notEqual(queueUrl, undefined, "There is not cloudximage SQS Queue.");

    let sqsClientListQueueTags= new SQSClientListQueueTags();
    const tagsResponce = await sqsClientListQueueTags.getListQueueTags(queueUrl);

    let isTagExist = Object.hasOwn(tagsResponce.Tags, 'cloudx')

    assert(isTagExist, true, "Encryption should be enable");
}); 

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }