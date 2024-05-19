// my-file-processing-app/src/services/apiService.js

import axios from 'axios';

const API_BASE_URL = 'https://ylmlre2f06.execute-api.us-west-1.amazonaws.com/prod/';

// Function to get a presigned URL from the API
export const getPresignedUrl = async (fileName, fileType) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/upload-url`, {
      fileName,
      fileType
    });
    return response.data;
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    throw error;
  }
};

// Function to post metadata to the API
export const postMetadata = async (inputText, filePath) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/process-url`, {
      inputText,
      inputFilePath: filePath
    });
    return response.data;
  } catch (error) {
    console.error('Error posting metadata:', error);
    throw error;
  }
};
