import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { AgGridReact } from "ag-grid-react";
import axios from 'axios';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import Appbar from './Appbar';
import { ipData, port } from './Ip';
import FileUpload from './upload';

const AudioDataGrid = () => {
  const [rowData, setRowData] = useState([]);
  const [quickFilterText, setQuickFilterText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`http://${ipData}:5000/files`);
      console.log(response.data);  // Log the data to inspect its structure
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
  const handleDeleteFile = async (id) => {
    try {
      const response = await axios.delete(`http://${ipData}:${port}/delete/${id}`);
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
    { field: "filename", headerName: "File Name", sortable: true, filter: true, width: 250 },
    {
      headerName: "Listen",
      field: "listen",
      cellRenderer: (params) => {
        const fileName = params.data.file_name || params.data.filename; // Ensure this matches your data structure

        if (!fileName) {
          return "No file";
        }

        return (
          <audio controls style={{ width: '100%',height: '80%',alignItems:"center" }}>
            <source src={`http://${ipData}:${port}/play/${fileName}`} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        );
      },
      width: 900
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
              display: "flex",
              alignItems: "center",
            }}
          >
            Download
          </a>
        );
      },
      width: 170
    }, {
      headerName: "Delete",
      field: "delete",
      cellRenderer: (params) => (
        <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${params.data.filename}?`)) {
                handleDeleteFile(params.data.id);  // Ensure this is the correct field
              }
            }}
          >
            Delete
          </Button>

      ),
      width: 130
    },


  ];

  return (

    <Box sx={{ p: 4, backgroundColor: "#EFF1F3", height: '100vh' }}>
      <Appbar />
      {/* Ag-Grid Table */}
      
      <div className="ag-theme-alpine" style={{ height: "70vh", width: "100%", marginTop: "20px" }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2F5559', fontSize: "60px", marginTop: "20px" }}>
            Audio Files
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <FileUpload />
        </Box>

        <AgGridReact className="grid-wrapper ag-theme-alpine" style={{ height: "55vh", width: "100%" }}
        rowData={rowData}
        columnDefs={columnDefs}
        pagination={true}
        paginationPageSize={20}
        animateRows={true}
        quickFilterText={quickFilterText}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
        }}
      />
      </div>
    </Box>
  );
};

export default AudioDataGrid;
