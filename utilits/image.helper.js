const fs = require('fs-extra');
const FormData = require('form-data');
const { readFileSync } = require('fs');
const assert = require('node:assert/strict');

const axios = require('axios');

async function uploadImage(imageFile, publicIpAddress)
{
    let url = `http://${publicIpAddress}/api/image`;

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

    let imageId = res.data.id;

    sleep(3000);

    return imageId;
}

async function deleteImage(publicIpAddress)
{
    let response = await axios.get(`http://${publicIpAddress}/api/image`);
    assert.equal(response.status,200);

    const imageId = response.data[response.data.length - 1].id;

    response = await axios.delete(`http://${publicIpAddress}/api/image/${imageId}`);

    sleep(3000);
}

async function deleteImages(publicIpAddress)
{
    let response = await axios.get(`http://${publicIpAddress}/api/image`);
    assert.equal(response.status,200);

    for (var i = 0; i < response.data.length; i++) {
        const imageId = response.data[i].id;
        response = await axios.delete(`http://${publicIpAddress}/api/image/${imageId}`);
    }

    sleep(3000);
}


async function deleteImageById(publicIpAddress, imageId)
{
    let response = await axios.delete(`http://${publicIpAddress}/api/image/${imageId}`);
    // assert.equal(response.status,200);

    sleep(3000);
}

async function getImages(publicIpAddress)
{
    let response = await axios.get(`http://${publicIpAddress}/api/image`);
    assert.equal(response.status,200);

    sleep(3000);

    return response;
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
}

module.exports = { uploadImage, deleteImage, deleteImageById, deleteImages, getImages }