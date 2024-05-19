const AWS = require('aws-sdk');

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    console.log("Received Event: ", JSON.stringify(event));
    console.log("Context:", JSON.stringify(context, null, 2));
    console.log("Process Env log:", process.env);

    for (let record of event.Records) {
        if (record.eventName === 'INSERT') {
            const item = record.dynamodb.NewImage;
            const file_id = item.id.S;

            // Ensure these parameters are correctly set
            const bucketName = process.env.BUCKET_NAME;
            const dynamoDBTable = process.env.DYNAMO_TABLE;
            const aws_region = process.env.REGION;
            const aws_default_region = process.env.AWS_DEFAULT_REGION;

            console.log(`dynamoDB table is: ${dynamoDBTable}`)
            console.log(`s3 bucket is: ${bucketName}`)
            console.log(`awsregion is: ${aws_region}`)
            console.log(`aws default region is: ${aws_default_region}`)

            // Launch an EC2 instance
            const params = {
                ImageId: 'ami-04ee585062b4857cb',  
                InstanceType: 't2.micro',
                MinCount: 1,
                MaxCount: 1,
                KeyName: 'my-ec2-key-pair',  
                IamInstanceProfile: {
                    Name: 'EC2ProcessingRole',
                },
                UserData: Buffer.from(
                    `#!/bin/bash
                    {
                    export AWS_DEFAULT_REGION='${aws_default_region}'
                    echo "Script execution started" >> /var/log/ec2-user-data.log
                    aws s3 cp s3://${bucketName}/scripts/EC2-processing-script.sh /home/ec2-user/EC2-processing-script.sh --region us-west-1>> /var/log/ec2-user-data.log 2>&1
                    if [ -f /home/ec2-user/EC2-processing-script.sh ]; then
                      echo "Processing script downloaded" >> /var/log/ec2-user-data.log
                      chmod +x /home/ec2-user/EC2-processing-script.sh
                      echo "Script execution permissions set " >> /var/log/ec2-user-data.log
                      /home/ec2-user/EC2-processing-script.sh  ${file_id} ${bucketName} ${dynamoDBTable} ${aws_region}>> /var/log/ec2-user-data.log 2>&1
                      echo "Script execution completed" >> /var/log/ec2-user-data.log
                    else
                      echo "Failed to download processing script" >> /var/log/ec2-user-data.log
                    fi
                    }
                    `).toString('base64') 
            };

            try {
                const result = await ec2.runInstances(params).promise();
                const instanceId = result.Instances[0].InstanceId;
                console.log(`Launched EC2 instance ${instanceId} to process file ${file_id}`);
                console.log('Launched EC2 instance',result);
            } catch (err) {
                console.error("Error launching EC2 instance: ", err);
            }
        }
    }
};


