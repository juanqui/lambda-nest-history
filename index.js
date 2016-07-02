"use strict";

var AWS = require('aws-sdk');
var config = require('config');
var nest = require('./nest.js');

AWS.config.region = config.get('aws.region');

var db = new AWS.DynamoDB();
var s3 = new AWS.S3();

exports.handler = (event, context, callback) => {
  // check if we have cached auth info
  s3.getObject({
    Bucket: config.get('aws.s3_bucket'),
    Key: "auth_cache"
  }).promise().then(data => {
    // load cached auth data
    let cached_auth_json = data.Body.toString('utf8');
    let cached_auth = JSON.parse(cached_auth_json);
    // login with cached auth
    nest.login_from_cache(cached_auth);
    // log
    console.log("loaded cached auth:", cached_auth);
  }).catch(err => {
    // could not get cached auth, do a full auth
    return nest.login(config.get('nest.email', 'nest.password')).then(data => {
      // cache auth data
      s3.putObject({
        Bucket: config.get('aws.s3_bucket'),
        Key: "auth_cache",
        Body: JSON.stringify(data)
      }).promise().then(data => {
        // log
        console.log("stored auth in cache:", data);
      }, err => callback("error storing auth in cache: " + JSON.stringify(err)));
    });
  }).then(() => {
    // get temperature data
    nest.get_thermostat_data().then(devices_data => {
      console.log("devices_data:", devices_data);
      // store data in dynamo
      for (let device_data of devices_data) {
        // store
        db.putItem({
          TableName: config.get('aws.dynamodb_table'),
          Item: {
            device_key: { S: device_data["device_key"] },
            timestamp: { N: (new Date).getTime().toString() },
            target_temperature: { N: device_data["target_temperature"].toString() },
            current_temperature: { N: device_data["current_temperature"].toString() },
            hvac_ac_state: { BOOL: device_data["hvac_ac_state"] },
            hvac_heater_state: { BOOL: device_data["hvac_heater_state"] }
          }
        }).promise().then(resp => {
          // signal done!
          callback(null, devices_data);
        }, err => callback("error storing data in dynamo: " + JSON.stringify(err)));
      }
    }, err => {
      if (err.status == 401) {
        // clear auth cache!
        s3.deleteObject({
          Bucket: config.get('aws.s3_bucket'),
          Key: "auth_cache"
        }).promise().then(data => {
          console.log("auth cache cleared");
        }, err => callback("error clearing auth cache: " + JSON.stringify(err)));
      }
    })
  });
}
