import React, { useState, useRef } from 'react';
import { ipData, port } from './Ip';

function FileUploadCode() {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null); // Reference to the hidden file input

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files)); // Convert FileList to an array
  };

  const handleFileUpload = async () => {
    if (files.length === 0) {
      alert("Please select files to upload.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`http://${ipData}:${port}/uploadCode`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        alert('Files uploaded successfully!');
        setFiles([]); // Clear the selected files after successful upload
      } else {
        alert(`Error: ${data.error || 'File upload failed'}`);
      }
    } catch (error) {
      alert('Error uploading files');
      console.error("Upload Error:", error);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click(); // Trigger click on the hidden file input
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef} // Reference the hidden input
        style={{ display: 'none' }} // Hide the default file input
      />
      
      <button
        type="button"
        onClick={handleClick} // Trigger file input click
        style={{
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Choose Files
      </button>

      <button
        type="button"
        onClick={handleFileUpload}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007BFF',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Upload Files
      </button>

      {files.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <strong>Selected Files:</strong>
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FileUploadCode;
