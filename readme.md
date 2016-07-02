# Nest History Lambda Function

This is a very simple [AWS Lambda](https://aws.amazon.com/lambda/) function that uses the Nest API to collect temperature data from Nest thermostats and store it in DynamoDB.

## Sample Payloads 

### Payload collected from the Nest API

```javascript
[
  {
    "device_key": "01ABCDEF01ABCDEF",
    "target_temperature": 24.7094,
    "current_temperature": 24.2,
    "hvac_ac_state": false,
    "hvac_heater_state": false
  },
  {
    "device_key": "02ABCDEF02ABCDEF",
    "target_temperature": 24.556,
    "current_temperature": 24.86,
    "hvac_ac_state": false,
    "hvac_heater_state": false
  }
]
```

### Payload stored in DynamoDB
```javascript
{
  "current_temperature": {
    "N": "24.2"
  },
  "device_key": {
    "S": "01ABCDEF01ABCDEF"
  },
  "hvac_ac_state": {
    "BOOL": false
  },
  "hvac_heater_state": {
    "BOOL": false
  },
  "target_temperature": {
    "N": "24.7094"
  },
  "timestamp": {
    "N": "1467383772074"
  }
}
```

## Installation

1. If you don't already have one, [create an AWS account](http://aws.amazon.com/)

2. Create an S3 Bucket (used to store Nest authentication cache)

3. Create a DynamoDB Table (used to store temperature data). Use "device_key" (string) as the partition key, and "timestamp" (integer) as the range key.

4. Create a new IAM Role (with Lambda trust) with the following policy document (used to give Lambda permission to log, s3, and dynamo)

  ```javascript
  {
      "Version": "2012-10-17",
      "Statement": [
          {
              "Effect": "Allow",
              "Action": [
                  "dynamodb:PutItem"
              ],
              "Resource": [
                  "arn:aws:dynamodb:us-east-1:<account_number>:table/<table_name>"
              ]
          },
          {
              "Effect": "Allow",
              "Action": [
                  "s3:DeleteObject",
                  "s3:GetObject",
                  "s3:PutObject"
              ],
              "Resource": [
                  "arn:aws:s3:::<bucket_Name>/auth_cache"
              ]
          },
          {
              "Effect": "Allow",
              "Action": [
                  "logs:*"
              ],
              "Resource": [
                  "*"
              ]
          }
      ]
  }
  ```

5. Create zip file of lambda function (including "node_modules" folder, and javascript files)

  ```bash
  cd nesthistory
  zip -r nesthistory.zip *
  ```

6. Create a new lambda function, upload the zip file you created
  * NodeJS 4.3 runtime
  * Set IAM role you created
  * 128MB
  * 5 second timeout

7. Schedule the Lambda function execute every 5 to 15 minutes (you can choose whatever you want)
