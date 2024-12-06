import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import {Typography, Box, Button, TextField, CircularProgress
} from '@mui/material';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ipData } from './Ip';
import Appbar from './Appbar';

const DataGrid = () => {
  const [rowData, setRowData] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      { label: "Voltage L1-GND", data: [], borderColor: "rgb(75, 192, 192)" },
      { label: "Voltage L2-GND", data: [], borderColor: "rgb(255, 99, 132)" },
      { label: "Voltage L3-GND", data: [], borderColor: "rgb(54, 162, 235)" },
      { label: "Energy Consumption Power", data: [], borderColor: "rgba(75, 192, 192, 1)" },
      { label: "Pressure", data: [], borderColor: "rgba(153, 102, 255, 1)" },
      { label: "Force", data: [], borderColor: "rgba(255, 159, 64, 1)" },
      { label: "Cycle Count", data: [], borderColor: "rgba(54, 162, 235, 1)" },
      { label: "Position of Punch", data: [], borderColor: "rgba(75, 192, 192, 1)" }
    ]
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const columnDefs = [
    { field: "id", headerName: "ID", sortable: true, filter: true, width: 80, editable: false },
    { field: "energy_consumption_power", headerName: "Energy Power", sortable: true, filter: true, editable: true },
    { field: "voltage_l1_gnd", headerName: "Voltage L1", sortable: true, filter: true, editable: true },
    { field: "voltage_l2_gnd", headerName: "Voltage L2", sortable: true, filter: true, editable: true },
    { field: "voltage_l3_gnd", headerName: "Voltage L3", sortable: true, filter: true, editable: true },
    { field: "pressure", headerName: "Pressure", sortable: true, filter: true, editable: true },
    { field: "forces", headerName: "Forces", sortable: true, filter: true, editable: true },
    { field: "cycle_count", headerName: "Cycle Count", sortable: true, filter: true, editable: true },
    { field: "position_of_punch", headerName: "Punch Position", sortable: true, filter: true, editable: true },
    { field: "record_date", headerName: "Record Date", sortable: true, filter: true, editable: false },
    { field: "record_time", headerName: "Record Time", sortable: true, filter: true, editable: false },
  ];

  async function fetchData() {
    setLoading(true);
    const access_token = localStorage.getItem('access_token');
    try {
      const response = await axios.post(`http://${ipData}:5000/data_range`, {
        start_date: startDate,
        end_date: endDate
      }, {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      if (response.status === 200) {
        const data = response.data;
        setRowData(data);

        // Prepare consolidated chart data
        const labels = [];
        const voltageL1 = [];
        const voltageL2 = [];
        const voltageL3 = [];
        const energyData = [];
        const pressureData = [];
        const forceData = [];
        const cycleData = [];
        const positionData = [];

        // Populate datasets
        data.forEach(item => {
          labels.push(`${item.record_date} ${item.record_time}`);
          voltageL1.push(item.voltage_l1_gnd);
          voltageL2.push(item.voltage_l2_gnd);
          voltageL3.push(item.voltage_l3_gnd);
          energyData.push(item.energy_consumption_power);
          pressureData.push(item.pressure);
          forceData.push(item.forces);
          cycleData.push(item.cycle_count);
          positionData.push(item.position_of_punch);
        });

        // Update the chartData state
        setChartData({
          labels,
          datasets: [
            { ...chartData.datasets[0], data: voltageL1 },
            { ...chartData.datasets[1], data: voltageL2 },
            { ...chartData.datasets[2], data: voltageL3 },
            { ...chartData.datasets[3], data: energyData },
            { ...chartData.datasets[4], data: pressureData },
            { ...chartData.datasets[5], data: forceData },
            { ...chartData.datasets[6], data: cycleData },
            { ...chartData.datasets[7], data: positionData }
          ]
        });
      } else {
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  }

  const handleFetchChartData = () => {
    if (startDate && endDate) {
      fetchData();
    } else {
      alert("Please enter both start and end dates.");
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: "#EFF1F3" }}>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: 8 }}>
      <Appbar/>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2F5559', fontSize: "60px" }}>
            History
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center", // Center the Box horizontally
            mb: 8
          }}
        >
          <Box sx={{ display: "flex", gap: 2, marginTop: "50px" }}>
            <TextField
              label="Start Date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              sx={{ backgroundColor: "#2F5559" }}
              onClick={handleFetchChartData}
            >
              Fetch Data
            </Button>
          </Box>
        </Box>


        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 2 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>Loading data...</Typography>
          </Box>
        )}

        {/* Consolidated Chart */}
        <Box sx={{
          mb: 3,
          height: 500,
          display: "flex", // Center content horizontally
          justifyContent: "center", // Center horizontally
          alignItems: "center" // Center vertically
        }}> {/* Set the container height */}
          <Line
            data={chartData}
            height={500} // Set canvas height to 500px
            options={{
              responsive: true,
              maintainAspectRatio: false, // Allow custom height without maintaining aspect ratio
              scales: {
                x: { title: { display: true, text: "Time" } },
                y: { title: { display: true, text: "Values" } }
              },
              plugins: {
                legend: { display: true, position: "top" },
                zoom: {
                  zoom: {
                    wheel: {
                      enabled: true, // Enable zooming with the scroll wheel
                    },
                    pinch: {
                      enabled: true, // Enable zooming with pinch gestures on touch devices
                    },
                    mode: 'x', // Allow zooming in both x and y directions
                    drag: {
                      enabled: true
                    },
                    mode: 'x',
                  },
                },
              }
            }}
            />
        </Box>

        {/* Ag-Grid */}
        {rowData.length > 0 && (
          <div className="grid-wrapper ag-theme-alpine" style={{ height: "55vh", width: "100%" }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={20}
              animateRows={true}
              suppressScrollOnNewData={true}
            />
          </div>
        )}
      </Box>
    </Box>
  );
};

export default DataGrid;
