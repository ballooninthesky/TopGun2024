import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { AgGridReact } from "ag-grid-react";
import axios from 'axios';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import Appbar from './Appbar';
import { ipData,port } from './Ip';
import FileUpload  from './upload';


const filech = () => {
  const [rowData, setRowData] = useState([]);
  const [quickFilterText, setQuickFilterText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const access_token = localStorage.getItem('access_token');
    try {
      const response = await axios.get(`http://${ipData}:5000/files`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (response.status === 200) {
        setRowData(response.data);
      } else {
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handlePlaySound = (fileName) => {
    const audio = new Audio(`http://${ipData}/files`);
    audio.play();
  };

  const handleDownloadFile = (fileName) => {
    const link = document.createElement("a");
    link.href = `http://${ipData}/download/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleDeleteFile = async (fileId) => {
    const access_token = localStorage.getItem('access_token');
    try {
      const response = await axios.delete(`http://${ipData}:${port}/delete/${fileId}`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (response.status === 200) {
        console.log("File deleted successfully");
        // Optionally refresh data or remove the deleted item from `rowData` state
        fetchData(); // Or remove the specific item from state without refreshing all data
      } else {
        console.error("Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };
  // กำหนด column definitions สำหรับ Ag-Grid
  const columnDefs = [
    { field: "id", headerName: "ID", sortable: true, filter: true, width: 80 },
    { field: "upload_date", headerName: "Date", sortable: true, filter: true, width: 150 },
    { field: "upload_time", headerName: "Time", sortable: true, filter: true, width: 150 },
    { field: "filename", headerName: "File Name", sortable: true, filter: true, width: 200 },
    {
        headerName: "Listen",
        field: "listen",
        cellRenderer: (params) => {
          const fileName = params.data.file_name || params.data.filename; // Ensure this matches your data structure
      
          if (!fileName) {
            return "No file";
          }
      
          return (
            <audio controls style={{ width: '100%' }}>
              <source src={`http://${ipData}:${port}/play/${fileName}`} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          );
        },
        width: 500
      },
      
      {
        headerName: "Download",
        field: "file_url",
        cellRenderer: (params) => {
          const fileName = params.data.file_name || params.data.filename; // Ensure this matches your data structure
      
          if (!fileName) {
            return <span>No file</span>;
          }
      
          return (
            <a
              href={`http://${ipData}:${port}/download/${fileName}`}
              download={fileName}
              style={{
                textDecoration: 'none',
                color: 'white',
                backgroundColor: '#212b57',
                borderRadius: '4px',
                fontWeight: 'bold',
                display: 'inline-block'
              }}
            >
              Download
            </a>
          );
        },
        width: 150
      },{
        headerName: "Delete",
        field: "delete",
        cellRenderer: (params) => (
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDeleteFile(params.data.id)}
          >
            Delete
          </Button>
        ),
        width: 120
      },
      
      
  ];

  return (
    
    <Box sx={{ p: 4, backgroundColor: "#EFF1F3", height: '100vh' }}>
        <Appbar/>
      {/* Ag-Grid Table */}
      <div className="ag-theme-alpine" style={{ height: "70vh", width: "100%", marginTop: "20px" }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2F5559', mb: 2, fontSize:"60px", marginTop: "50px" }}>
      Audio Files
      </Typography>
      <FileUpload></FileUpload>

        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={20}
          animateRows={true}
          quickFilterText={quickFilterText} // เพิ่ม quick filter
          defaultColDef={{
            sortable: true, // เปิดใช้งาน sorting
            filter: true, // เปิดใช้งาน filtering
            resizable: true, // เปิดใช้งานการปรับขนาด column
          }}
        />
      </div>
    </Box>
  );
};

export default filech;
