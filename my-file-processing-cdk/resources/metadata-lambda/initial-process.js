const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
//const { nanoid } = require('nanoid');

// Use dynamic import for ES Modules
let nanoid;

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));
  console.log("Environment Variables:", JSON.stringify(process.env));
  
  if (!nanoid) {
    const module = await import('nanoid');
    nanoid = module.nanoid;
  }
  
  
  const { inputText, filePath } = JSON.parse(event.body);
  

  const id = nanoid(); // Generate a unique ID

  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      id,
      inputText,
      filePath
    }
  };

  try {
    await dynamoDB.put(params).promise();
    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "*",  
      "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
      "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
      "Access-Control-Allow-Credentials": true,
      "Content-Type": "application/json"
    },
      body: JSON.stringify({ message: 'Data stored successfully', id })
    };
    
  } catch (err) {
    console.error('DynamoDB error: ', err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000", 
        "Access-Control-Allow-Credentials": true, 
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Content-Type": "application/json"
      },

      body: JSON.stringify({ error: err.message })
    };
  }
};
