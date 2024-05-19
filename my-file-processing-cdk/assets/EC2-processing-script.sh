#!/bin/bash
set -e

FILE_ID=$1
BUCKET_NAME=$2
DYNAMO_TABLE=$3
AWS_REGION=$4


INPUT_TEXT=$(aws dynamodb get-item --table-name ${DYNAMO_TABLE} --key '{"id": {"S": "'${FILE_ID}'"}}' --query 'Item.inputText.S' --output text)
echo "Input Text: ${INPUT_TEXT}"

INPUT_FILE_PATH=$(aws dynamodb get-item --table-name ${DYNAMO_TABLE} --key '{"id": {"S": "'${FILE_ID}'"}}' --query 'Item.filePath.S' --output text)
echo "Input File Path: ${INPUT_FILE_PATH}"


# Install AWS CLI if not already installed
if ! command -v aws &> /dev/null
then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
fi

# Download the file from S3
aws s3 cp "${INPUT_FILE_PATH}" "/home/ec2-user/${FILE_ID}.TXT"
echo "The file has been downloaded."

# Modify the file
# Append the input_text to the file
echo "${INPUT_TEXT}" >> /home/ec2-user/${FILE_ID}.TXT
echo "The file has been modified."

# Upload the modified file back to S3
OUTPUT_FILE="${FILE_ID}.out.txt"    
echo "The output file name is ${OUTPUT_FILE}."

aws s3 cp "/home/ec2-user/${FILE_ID}.TXT" "s3://${BUCKET_NAME}/uploads/${OUTPUT_FILE}"
echo "The file has been uploaded back to S3."

# Update DynamoDB with the new file path
aws dynamodb update-item --table-name ${DYNAMO_TABLE} \
    --key "{\"id\": {\"S\": \"${FILE_ID}\"}}" \
    --update-expression "SET output_file_path = :p" \
    --expression-attribute-values "{\":p\": {\"S\": \"${BUCKET_NAME}/uploads/${OUTPUT_FILE}\"}}" \
    --region ${AWS_REGION}

echo "The file path has been updated in DynamoDB."

# Terminate the instance
INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id)
aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region ${AWS_REGION}  
echo "The instance has been terminated."
