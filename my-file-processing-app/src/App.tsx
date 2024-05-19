// src/App.tsx

import React from 'react';
import './App.css';
import FileUploadComponent from './components/FileUploadComponent';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>File Upload to AWS</h1>
        <FileUploadComponent />
      </header>
    </div>
  );
}

export default App;
