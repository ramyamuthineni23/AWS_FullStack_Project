import React, { useState } from 'react';
import axios, { AxiosRequestConfig, AxiosProgressEvent } from 'axios';

interface PresignedUrlResponse{
  url:string;
}

//Frontend code
const FileUploadComponent: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const apiBaseUrl = process.env.REACT_APP_API_BASED_URL_ENDPOINT;
  console.log("Api base url:", apiBaseUrl);
  console.log("Process log", process.env);

  
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedFile && inputText) {
      try {
        // Step 1: Request a presigned URL from the backend
        const response = await axios.post<PresignedUrlResponse>(
          `${apiBaseUrl}/pre-signed-urls`,
          { filename: selectedFile.name, contentType: selectedFile.type },
          { headers: { 'Content-Type': 'application/json' } }
        );
        console.log("Content Type:", selectedFile.type);

        console.log("Full response data:", response.data);

        const  url  = response.data.url; 


        console.log("Presigned URL response:", url);

        if (!url) {
          console.error('Presigned URL is undefined:', response.data);
          alert('Failed to get a valid presigned URL');
          return;
        }

        console.log("Presigned URL:", url);
        // Step 2: Use the presigned URL to upload the file directly to S3
        const config: AxiosRequestConfig = {
          headers: { 'Content-Type': selectedFile.type,        },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const total = progressEvent.total || 1; // Fallback if total is undefined
            const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
            console.log(`File upload progress: ${percentCompleted}%`);
          }
        };  

        console.log("UploadingURL:", url);
        console.log("Selected File:", selectedFile);
        console.log("Selected File:", selectedFile.type);
        console.log("Config:", config);


        await axios.put(url, selectedFile, config);

        console.log('File uploaded successfully!');
        alert('File uploaded successfully!');

        const bucketName = process.env.REACT_APP_BUCKETNAME;
        const region = process.env.REACT_APP_AWS_REGION;
        const filename = selectedFile.name;
        
        console.log("Bucket Name:", bucketName);
        console.log("region:", region);
        console.log("File Name:", filename);

        const key = `uploads/${filename}`; 

        const fileURL = `s3://${bucketName}/${key}`;
        console.log("Access URL:", fileURL);
        
        // Sending metadata to your server
        const metadataResponse = await axios.post(
          `${apiBaseUrl}/file-metadata`,
          { inputText: inputText, filePath: fileURL },
          { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('Metadata saved:', metadataResponse.data);
        alert('Metadata saved successfully!');

      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload the file and metadata.');
      }
    } else {
      alert('Please select a file and enter the text.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Text Input:
          <input type="text" value={inputText} onChange={handleTextInputChange} />
        </label>
      </div>
      <div>
        <label>
          File Input:
          <input type="file" onChange={handleFileInputChange} accept="text/plain" />
        </label>
      </div>
      <button type="submit">Upload</button>
    </form>
  );
};

export default FileUploadComponent;
