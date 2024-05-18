# AWS Serverless File Processor

This project demonstrates a serverless architecture using AWS to automatically process text files uploaded by users. The frontend allows users to upload a text file and input text, which is then processed by backend services running on AWS. The processed file is appended with the input text and saved back to S3, with metadata managed through DynamoDB.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/) (version 14.x or later)
- [npm](https://npmjs.com/) (comes with Node.js)
- [AWS CLI](https://aws.amazon.com/cli/) (version 2.x)
- [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) (version 2.x)
- An AWS account and AWS credentials configured locally

## Table of Contents
- Project Overview
- Technologies Used
- Setup Instructions
- Backend Setup
- Frontend Setup
- Usage Guide
- Architecture Diagram
- References
- Demo

## Project Overview

### System Components

- Frontend: A responsive web UI built with ReactJS.
- Backend: AWS services including Lambda, S3, DynamoDB, EC2, and API Gateway.
- Infrastructure Management: AWS CDK is used to define and deploy all infrastructure.

### Features
- Direct upload of files to S3 from the browser.
- Storage of file metadata and paths in DynamoDB via Lambda and API Gateway.
- Automatic EC2 instance creation to process files by appending text.
- Secure handling and storage of files without making them public.

### Technologies Used
- Frontend: ReactJS
- Backend: AWS Lambda, S3, DynamoDB, EC2, API Gateway, IAM
- DevOps: AWS CDK, AWS SDK for JavaScript (V3)
- Programming Languages: TypeScript, JavaScript
- Others: Node.js, Git

## Setup Instructions

Follow these steps to set up the project:

### 1. Clone the Repository

git clone <your-repository-url>
cd your-repository-name

### 2. Front-End Setup (`my-file-processing-app`)

1. **Navigate to the Front-End Application Directory**

   cd /path to your file directory/my-file-processing-app

2. **Install Dependencies**

   npm install

3. **Configure Environment Variables**
   Create a `.env` file in the root of the `my-file-processing-app` directory. Replace the placeholders with the appropriate API endpoints that you will get after deploying your CDK stack.

   REACT_APP_PRESIGNED_URL_API=\<Your API Gateway endpoint for presigned URL>
   
   REACT_APP_METADATA_API=\<Your API Gateway endpoint for inserting metadata in DynamoDB>

### 3. Back-End Setup (`my-file-processing-cdk`)

1. **Navigate to the CDK Directory**

   From the root of your repository:

   cd /path to directory/my-file-processing-cdk

2. **Install CDK Dependencies**

   npm install

3. **Deploy the CDK Stack**

   Make sure you are in the `my-file-processing-cdk` directory and then run:

   cdk deploy

   - After deployment, CDK will output the API Gateway endpoint for `presigned-url` and `metadata`. Update these in your front-end's `.env` file.

### 4. Running the Application

After setting up both the front-end and the back-end, you can run the application:

1. **Run the Front-End Application**

   Navigate to the `my-file-processing-app` directory:

   cd my-file-processing-app

   Start the React app:

   npm start

   This will run your React app on [http://localhost:3000](http://localhost:3000).

## Testing the Application

To test the application:

1. Open the web application in your browser at [http://localhost:3000](http://localhost:3000).
2. Enter some text in the "Input Text" field.
3. Choose a file to upload.
4. Click the "Submit" button and observe that the file uploads successfully and the metadata is saved in DynamoDB and Ec2 Instance 

## Additional Information

- **Lambda Functions**: The Lambda code is located under `my-file-processing-cdk/resources/lambdas`.
- **Front-End Code**: The main application code is in `my-file-processing-app/src`.

## Troubleshooting

- **AWS Permissions**: Ensure your AWS CLI is configured with sufficient permissions to deploy Lambda functions, S3 buckets, DynamoDB tables, and API Gateway.
- **CDK Bootstrap**: If you haven't used CDK in your AWS account/region before, you might need to run `cdk bootstrap aws://ACCOUNT_ID/REGION` before deploying.
- **Environment Variables**: Make sure your `.env` file in the React app is correctly pointing to the deployed API Gateway endpoints.

## Architecture Diagram
Include a diagram to illustrate the architecture:


## References
- AWS Official Documentation: https://docs.aws.amazon.com
- ReactJS Docs: https://reactjs.org/docs/getting-started.html
- CDK Guide: https://docs.aws.amazon.com/cdk/latest/guide
- SDK Guide: https://docs.aws.amazon.com/sdkref/latest/guide/overview.html
## Demo
