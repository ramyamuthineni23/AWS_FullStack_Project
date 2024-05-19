//Generating presigned url for to get temporary access to s3 bucket to upload fileURLToPath
const AWS = require('aws-sdk');
const { fileURLToPath } = require('url')
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
try{
  
  // Ensure event.body is an object by parsing if a string
  if (typeof event.body === 'string') {
    event.body = JSON.parse(event.body);
  }

  // Correcting typo here
  const filename = event.filename || event.filenname || event.body.filename;


  console.log("Filename:", filename);

  if (!filename) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: 'Missing filename in the request body or the event object' })
    };
  }

    const bucketName = process.env.BUCKET_NAME;
    console.log("BucketName:", bucketName);

    const params = {
      Bucket: bucketName,
      Key: `uploads/${filename}`,
      Expires: 300, // Link expiration time (300 seconds = 5 minutes)
      ContentType: 'text/plain',
    };

    // Get presigned URL from S3
    const presignedURL = await s3.getSignedUrlPromise('putObject', params);

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: presignedURL })
    };

  } catch (err) {
    console.error('Error processing event:', err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal server error", message: err.message })
    };
  }
};
