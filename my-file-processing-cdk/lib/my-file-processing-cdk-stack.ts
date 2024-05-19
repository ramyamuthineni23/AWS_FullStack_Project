import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

export class MyFileProcessingCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for file uploads
    const fileUploadBucket = new s3.Bucket(this, 'FileUploadBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ["http://localhost:3000"], 
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"]
        }
      ]
    });

    // DynamoDB table to store file metadata
    const fileTable = new dynamodb.Table(this, 'FileTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      
    });

    const accountId = this.node.tryGetContext('accountId') || process.env.CDK_DEFAULT_ACCOUNT || cdk.Stack.of(this).account;
    const ec2ProcessingRoleName = this.node.tryGetContext('ec2ProcessingRoleName') || 'EC2ProcessingRole';

    // IAM role for the Lambda functions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
      ],
    });

    
    // Dynamically create the resource ARN for the EC2ProcessingRole
    const ec2ProcessingRoleArn = `arn:aws:iam::${accountId}:role/${ec2ProcessingRoleName}`;

    // Add policy to allow 'iam:PassRole' for the EC2ProcessingRole
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [ec2ProcessingRoleArn],
      effect: iam.Effect.ALLOW,
      conditions: {
        "StringEquals": {
          "iam:PassedToService": "ec2.amazonaws.com"
        }
      }
    }));


    // Grant the Lambda function permissions to get preignedURL
    const presignedUrlFunction = new lambda.Function(this, 'PresignedUrlFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../resources/presigned-url-lambda')),
      handler: 'index.handler',
      environment: {
        BUCKET_NAME: fileUploadBucket.bucketName,
      },
    });

    // Grant the Lambda function permissions to put objects in the S3 bucket
    fileUploadBucket.grantPut(presignedUrlFunction);
    
    // Lambda function for initial processing/metada data upload in dynamodb
    const initialProcessFunction = new lambda.Function(this, 'InitialProcessFunction', {
      runtime: lambda.Runtime.NODEJS_16_X, 
      handler: 'initial-process.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../resources/metadata-lambda')),
      environment: {
        TABLE_NAME: fileTable.tableName,
        BUCKET_NAME: fileUploadBucket.bucketName,
      },
      //role: lambdaExecutionRole,
    });

    fileTable.grantWriteData(initialProcessFunction);
    fileUploadBucket.grantReadWrite(initialProcessFunction);

    // API Gateway to expose the Lambda function
      const api = new apigateway.LambdaRestApi(this, 'FileUploadApi', {
      handler: initialProcessFunction,
      proxy: false,
    });

    const presignedUrlsStack = api.root.addResource('pre-signed-urls');

    presignedUrlsStack.addMethod('POST', new apigateway.LambdaIntegration(presignedUrlFunction), {
      methodResponses: [{  
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        }
      }],
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    presignedUrlsStack.addMethod('OPTIONS', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
        },
        responseTemplates: {
          'application/json': '{"statusCode": 200}'
        },
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        }
      }],
      authorizationType: apigateway.AuthorizationType.NONE,
    
    });

    const fileMetadataStack = api.root.addResource('file-metadata');

    fileMetadataStack.addMethod('POST', new apigateway.LambdaIntegration(initialProcessFunction), {
      methodResponses: [{  
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        }
      }],
     
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    
    fileMetadataStack.addMethod('OPTIONS',  new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
        },
        responseTemplates: {
          'application/json': '{"statusCode": 200}'
        },
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      }
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        }
      }],
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Deploy the EC2 processing script to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployEC2ProcessingScript', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../assets'))],
      destinationBucket: fileUploadBucket,  
      destinationKeyPrefix: 'scripts' 
    });

    
    // Lambda function that triggers EC2 instances
    const ec2TriggerFunction = new lambda.Function(this, 'EC2TriggerFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,  
      handler: 'ec2-trigger.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../resources/ec2-handler-lambda')),
      environment: {
        BUCKET_NAME: fileUploadBucket.bucketName,
        DYNAMO_TABLE: fileTable.tableName,
        REGION:cdk.Stack.of(this).region,
        PROCESSING_SCRIPT_PATH: `s3://${fileUploadBucket.bucketName}/scripts/Ec2-processing-script.sh`,
      },
      role: lambdaExecutionRole,
  });

    ec2TriggerFunction.addEventSource(new DynamoEventSource(fileTable, {
     startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 1,
      bisectBatchOnError: true,
      retryAttempts: 2
}));

    fileTable.grantStreamRead(ec2TriggerFunction);

    

    // Outputs for easy access to resource names and paths
    new cdk.CfnOutput(this, 'BucketName', { value: fileUploadBucket.bucketName });
    new cdk.CfnOutput(this, 'TableName', { value: fileTable.tableName });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'PresignedURLFunctionName', { value: presignedUrlFunction.functionName });
    new cdk.CfnOutput(this, 'InitialLambdaFunctionName', { value: initialProcessFunction.functionName });
    new cdk.CfnOutput(this, 'Ec2TriggerLambdaFunctionName', { value: ec2TriggerFunction.functionName });
  }
}
