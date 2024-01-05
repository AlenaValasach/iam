const assert = require('node:assert/strict');

const { EC2ClientVpcs } = require('../../services/ec2/vpc/vpc.vpcs');
const { EC2ClientInstances } = require('../../services/ec2/ec2.instances');
const { EC2ClientVpcSubnets } = require('../../services/ec2/vpc/vpc.subnets');
const { SNSClientConfirmSubscription } = require('../../services/sns/sns.confirmSubscription');
const { SNSClientListTopics } = require('../../services/sns/sns.listTopics');

const { GmailService } = require('../../utilits/gmail.service');

const { GMAIL_CONFIG } = require('../../gmail.config');
const base64 = require('js-base64');
const axios = require('axios');

const fs = require('fs-extra');
const FormData = require('form-data');
const { readFileSync } = require('fs');

const { chromium } = require('playwright');

let publicIpAddress;

describe('SNS/SQS application functional validation', function () {
    beforeAll(async () => {
        let ec2ClientInstances = new EC2ClientInstances();
        const instanceResponse = await ec2ClientInstances.getRunningInstances();

        let publicInstance = instanceResponse.Reservations[0].Instances[0];
        publicIpAddress = publicInstance.PublicIpAddress;
    });

    test("The user can subscribe to notifications about application events via a provided email address", async () => {
        const email = "usern@me.com";

        const response = await axios.post(`http://${publicIpAddress}/api/notification/${email}`);

        assert.equal(response.status, 200);
        assert.equal(response.data.includes("Successfully subscribed."), true);
    }); 

    test("Gets possible to view all existing subscriptions using {base URL}/notification GET API call", async () => {
        const response = await axios.get(`http://${publicIpAddress}/api/notification`);
        assert.equal(response.status,200);

        response.data.forEach((resp) => {
        assert.notEqual(resp.SubscriptionArn, undefined, 'SubscriptionArn is not presented');
        assert.notEqual(resp.Protocol, undefined, 'Protocol is not presented');
        assert.notEqual(resp.Endpoint, undefined, 'Endpoint is not presented');
        assert.notEqual(resp.TopicArn, undefined, 'TopicArn is not presented');
        });
    }); 

    test("The user has to confirm the subscription after receiving the confirmation email", async () => {
        const email = GMAIL_CONFIG.email;

        let snsClientListTopics = new SNSClientListTopics();
        const topicsResponce = await snsClientListTopics.getListTopics();

        let snsTopic = topicsResponce.Topics.find(t => t.TopicArn.includes("cloudximage-TopicSNSTopic"));

        assert.notEqual(snsTopic, undefined, "There is not cloudximage SNS Topic.");
    
        const postNotificationResponce = await axios.post(
            `http://${publicIpAddress}/api/notification/${email}`,
        );

        assert.equal(postNotificationResponce.status, 200);
        assert.equal(postNotificationResponce.data.includes('Successfully subscribed.'), true);

        sleep(3000);

        const subject = 'AWS Notification - Subscription Confirmation';
        let gmailService = new GmailService();
        let message = await gmailService.getLatestMessage();
        let messageDetails = await gmailService.getMessageDetails(message.id);

        let expectedSubject = messageDetails.payload.headers.find(x => x.name === "Subject").value;

        assert.equal(subject, expectedSubject, `There are not message where Subject=${subject}`);

        let body = base64.decode(messageDetails.payload.body.data);
        const token = body.match(/Token=([^&]*)/)[1];

        let snsClientConfirmSubscription = new SNSClientConfirmSubscription();
        const confirmedSubscribeResponce = await snsClientConfirmSubscription.confirmSubscription(snsTopic.TopicArn, token);

        let isSubscriptionArnExist = Object.hasOwn(confirmedSubscribeResponce, 'SubscriptionArn')
        assert.equal(isSubscriptionArnExist, true, "There is no any SubscriptionArn key in Confirm Subscription response");
        
        const getNotificationResponce = await axios.get(`http://${publicIpAddress}/api/notification`);
        assert.equal(getNotificationResponce.status, 200);

        const notification = getNotificationResponce.data.find(r=> r.Endpoint === email);

        assert.equal(notification.SubscriptionArn.includes('cloudximage-TopicSNSTopic'), true);
        assert.equal(notification.Protocol, 'email');
        assert.equal(notification.Endpoint, email);
        assert.equal(notification.TopicArn, snsTopic.TopicArn);
    }); 

    test("The subscribed user receives notifications about images events (image is uploaded, image is deleted)", async () => {
        await uploadImage("flower.jpg", `http://${publicIpAddress}/api/image`)

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

        await deleteImage(publicIpAddress)
        
        message = await gmailService.getLatestMessage();
        messageDetails = await gmailService.getMessageDetails(message.id);
        expectedSubject = messageDetails.payload.headers.find(x => x.name === "Subject").value;
        body = base64.decode(messageDetails.payload.body.data);

        // Assert image metadata information and a download link
        assert.equal(subject, expectedSubject, `There are not message where Subject=${subject}`);
        assert.equal(body.includes('event_type: delete'), true);
    }); 

    test("The user can download the image using the download link from the notification", async () => {
        await uploadImage("flower.jpg", `http://${publicIpAddress}/api/image`)

        let gmailService = new GmailService();

        let message = await gmailService.getLatestMessage();
        let messageDetails = await gmailService.getMessageDetails(message.id);
        let body = base64.decode(messageDetails.payload.body.data);

        // Get download URL
        const downloadUrl = body.match(/download_link:\s(.+)\r\n/)[1];

        try {
            const downloadImageResponse = await axios.get(downloadUrl, { responseType: 'blob' });
            
            assert.equal(downloadImageResponse.status, 200);
        } 
        catch (error) {
            expect.fail('Image is not downloaded:' + error.message);
        }

        await deleteImage(publicIpAddress);
    });

    test("The user can unsubscribe from the notifications", async () => {
        await uploadImage("flower.jpg", `http://${publicIpAddress}/api/image`)

        const subject = 'AWS Notification Message';
        let gmailService = new GmailService();

        let message = await gmailService.getLatestMessage();
        let messageDetails = await gmailService.getMessageDetails(message.id);
        let expectedSubject = messageDetails.payload.headers.find(x => x.name === "Subject").value;
        let body = base64.decode(messageDetails.payload.body.data);

        assert.equal(subject, expectedSubject, `There are not message where Subject=${subject}`);
        assert.equal(body.includes('event_type: upload'), true);

        // Get unsubscribe URL
        const unsubscribeUrl = body.match(/(http.*\/unsubscribe[^\s]+)/)[1];

        // Open browser
        const browser = await chromium.launch({ headless: false });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(unsubscribeUrl, { timeout: 10_000, waitUntil: 'domcontentloaded' });
        await page.waitForSelector('h1#status', { state: 'visible' });

        const elementText = await page.locator('h1#status').textContent();
        assert.equal(elementText.includes('Subscription removed!'), true);

        await browser.close();

        sleep(3000);

        const unsubscribeSubject = 'AWS Notification - Unsubscribe Confirmation';
        message = await gmailService.getLatestMessage();
        messageDetails = await gmailService.getMessageDetails(message.id);

        expectedSubject = messageDetails.payload.headers.find(x => x.name === "Subject").value;
        body = base64.decode(messageDetails.payload.body.data);

        assert.equal(unsubscribeSubject, expectedSubject, `There are not message where Subject=${unsubscribeSubject}`);
        assert.equal(body.includes("Your subscription to the topic below has been deactivated"), true);

        await deleteImage(publicIpAddress);
    }); 

    test("The unsubscribed user does not receive further notifications", async () => {
        await uploadImage("flower.jpg", `http://${publicIpAddress}/api/image`)

        const subject = 'AWS Notification Message';
        let gmailService = new GmailService();
    
        let message = await gmailService.getLatestMessage();
        let messageDetails = await gmailService.getMessageDetails(message.id);
        let expectedSubject = messageDetails.payload.headers.find(x => x.name === "Subject").value;
        let body = base64.decode(messageDetails.payload.body.data);

        assert.notEqual(subject, expectedSubject, `There are message where Subject=${subject}`);
        assert.notEqual(body.includes('event_type: upload'), true);

        await deleteImage(publicIpAddress);
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

        sleep(3000);
    }

    async function deleteImage(publicIpAddress)
    {
        const response = await axios.get(`http://${publicIpAddress}/api/image`);
        assert.equal(response.status,200);

        const imageId = response.data[response.data.length - 1].id;

        await axios.delete(`http://${publicIpAddress}/api/image/${imageId}`);

        sleep(3000);
    }
});

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
}