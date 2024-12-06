import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import {
  Box,
  Typography,
  Button,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Appbar from './Appbar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const SOCKET_BASE_URL = 'ws://158.108.97.12:8000/ws';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [confirmedApiKey, setConfirmedApiKey] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voltageData, setVoltageData] = useState({ labels: [], datasets: [{ label: 'L1-GND', data: [] }, { label: 'L2-GND', data: [] }, { label: 'L3-GND', data: [] }] });
  const [powerData, setPowerData] = useState({ labels: [], datasets: [{ label: 'Power (W)', data: [] }] });
  const [pressureData, setPressureData] = useState({ labels: [], datasets: [{ label: 'Pressure (Pa)', data: [] }] });
  const [forceData, setForceData] = useState({ labels: [], datasets: [{ label: 'Force (N)', data: [] }] });
  const [cycleData, setCycleData] = useState({ labels: [], datasets: [{ label: 'Cycle Count', data: [] }] });
  const [positionData, setPositionData] = useState({ labels: [], datasets: [{ label: 'Position (mm)', data: [] }] });

  const navigate = useNavigate();
  const ws = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const [chartData, setChartData] = useState({
    labels: [],

  });


  const connectWebSocket = () => {
    ws.current = new WebSocket(SOCKET_BASE_URL);
    ws.current.onopen = () => {
      console.log("WebSocket connection established.");
      ws.current.send(confirmedApiKey);
      setIsConnected(true);
    };
    ws.current.onmessage = (event) => {
      const currentTime = Date.now();
      if (currentTime - lastUpdateRef.current >= 200) {
        lastUpdateRef.current = currentTime;
        try {
          const data = JSON.parse(event.data);
          console.log("Received data:", data);
          updateCharts(data);
        } catch (error) {
          console.error("Error parsing WebSocket data:", error);
        }
      }
    };
    ws.current.onerror = (error) => console.error("WebSocket error:", error);
    ws.current.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket connection closed.");
    }
  };

  const MAX_POINTS = 200;


  const handleDataUpdate = (prevData, newData) => {
    const timestamp = new Date().toLocaleTimeString();

    // If data exceeds MAX_POINTS, reset the chart
    if (prevData.labels.length >= MAX_POINTS) {
      return {
        labels: [], // Clear labels
        datasets: [
          {
            ...prevData.datasets[0],
            data: [], // Clear data for the dataset
          },
        ],
      };
    }

    // Otherwise, add the new data point
    const updatedLabels = [...prevData.labels, timestamp];
    const updatedDataset = [...prevData.datasets[0].data, newData];

    return {
      labels: updatedLabels,
      datasets: [{ ...prevData.datasets[0], data: updatedDataset }],
    };
  };

  const updateCharts = (data) => {
    const timestamp = new Date().toLocaleTimeString();

    if (data["Voltage"]) {
      const { "L1-GND": l1GND, "L2-GND": l2GND, "L3-GND": l3GND } = data["Voltage"];
      setVoltageData((prevData) => {
        // If max points reached, reset chart data
        if (prevData.labels.length >= MAX_POINTS) {
          return {
            labels: [],
            datasets: [
              { ...prevData.datasets[0], data: [], borderColor: 'rgb(75, 192, 192)' },
              { ...prevData.datasets[1], data: [], borderColor: 'rgb(255, 99, 132)' },
              { ...prevData.datasets[2], data: [], borderColor: 'rgb(54, 162, 235)' },
            ],
          };
        }

        // Otherwise, add the new data point
        const updatedLabels = [...prevData.labels, timestamp];
        return {
          labels: updatedLabels,
          datasets: [
            {
              ...prevData.datasets[0],
              data: [...prevData.datasets[0].data, l1GND],
              borderColor: 'rgb(75, 192, 192)',
            },
            {
              ...prevData.datasets[1],
              data: [...prevData.datasets[1].data, l2GND],
              borderColor: 'rgb(255, 99, 132)',
            },
            {
              ...prevData.datasets[2],
              data: [...prevData.datasets[2].data, l3GND],
              borderColor: 'rgb(54, 162, 235)',
            },
          ],
        };
      });
    }

    if (data["Energy Consumption"]) {
      setPowerData((prevData) =>
        handleDataUpdate(prevData, data["Energy Consumption"]["Power"])
      );
    }
    if (data["Pressure"] !== undefined) {
      setPressureData((prevData) =>
        handleDataUpdate(prevData, data["Pressure"])
      );
    }
    if (data["Force"] !== undefined) {
      setForceData((prevData) =>
        handleDataUpdate(prevData, data["Force"])
      );
    }
    if (data["Cycle Count"] !== undefined) {
      setCycleData((prevData) =>
        handleDataUpdate(prevData, data["Cycle Count"])
      );
    }
    if (data["Position of the Punch"] !== undefined) {
      setPositionData((prevData) =>
        handleDataUpdate(prevData, data["Position of the Punch"])
      );
    }
  };


  const handleConnect = (e) => {
    e.preventDefault();
    setConfirmedApiKey(apiKey);
  };

  const handleStart = () => {
    if (confirmedApiKey && !isConnected) {
      connectWebSocket();
    }
  };

  const handleStop = () => {
    if (ws.current) {
      ws.current.close();
    }
  };

  const handleToggleConnection = () => {
    if (isConnected) {
      handleStop();
    } else {
      handleStart();
    }
  };

  useEffect(() => {
    return () => ws.current && ws.current.close();
  }, []);

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);

  };

  const lineChartOptions = {
    responsive: true,
    animation: false,
    scales: {
      y: {
        title: {
          display: true,
          text: '', // Placeholder for dynamic y-axis title
        },
      },
    },
    plugins: {
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

    },
  };

  const lineChartData = {
    borderColor: 'rgb(255, 99, 132)', // Set line color here
    backgroundColor: 'rgba(255, 99, 132, 0.2)', // Set background fill color under the line
    borderWidth: 2,
    fill: true, // Enable fill to show background color under the line
  };
  return (
    <Box sx={{ display: 'flex', backgroundColor: "#EFF1F3" }}>
     <Appbar/>

      <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: 10, marginLeft: 10 }}>
        {/* Main content */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            mb: 4,
          }}
        >
           <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2F5559', mb: 2, fontSize:'60px' }}>
        Dashboard
      </Typography>
          <form onSubmit={handleConnect} style={{ marginBottom: '20px' }}>
            <TextField
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API Key"
              variant="outlined"
              sx={{ marginRight: 2, width: '400px' }}
              inputProps={{
                style: {
                  padding: '7px',
                },
              }}
            />
            <Button type="submit" variant="contained" sx={{ backgroundColor: "#2F5559", width: '150px' }}>Save API Key</Button>
          </form>

          <Button
            onClick={handleToggleConnection}
            variant="contained"
            disabled={!confirmedApiKey}
            style={{
              backgroundColor: !confirmedApiKey ? 'gray' : isConnected ? 'red' : 'green',
              color: 'white',
              opacity: !confirmedApiKey ? 0.6 : 1, // Slight opacity for a "disabled" look
              pointerEvents: !confirmedApiKey ? 'none' : 'auto', // Prevent interaction if disabled
            }}
          >
            {isConnected ? 'Stop' : 'Start'}
          </Button>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <Box sx={{
            p: 2, boxShadow: 3, borderRadius: 2, border: '1px solid #ccc', backgroundColor: '#fff',
            width: '800px', // Set width here
            height: '450px'
          }}>
            <Typography variant="h6">Voltage</Typography>
            <Line
              data={voltageData}
              options={{
                ...lineChartOptions,
                scales: {
                  ...lineChartOptions.scales,
                  y: {
                    ...lineChartOptions.scales.y,
                    title: { ...lineChartOptions.scales.y.title, text: 'Power (W)' },
                  },
                },
              }}
              style={{ height: '90%', width: '100%' }} />
          </Box>

          {/* <Box sx={{ p: 2, boxShadow: 3, borderRadius: 2, border: '1px solid #ccc', backgroundColor: '#fff',width: '800px', // Set width here
    height: '450px' }}>
            <Typography variant="h6">Power</Typography>
            <Line
              data={powerData}
              options={{
                ...lineChartData,
                ...lineChartOptions,
                scales: {
                  ...lineChartOptions.scales,
                  y: {
                    ...lineChartOptions.scales.y,
                    title: { ...lineChartOptions.scales.y.title, text: 'Power (W)' },
                  },
                },
              }}
              style={{ height: '90%', width: '100%' }}/>
          </Box> */}

          <Box sx={{
            p: 2, boxShadow: 3, borderRadius: 2, border: '1px solid #ccc', backgroundColor: '#fff', width: '800px', // Set width here
            height: '450px'
          }}>
            <Typography variant="h6">Pressure</Typography>
            <Line
              data={pressureData}
              options={{
                ...lineChartData,
                ...lineChartOptions,
                scales: {
                  ...lineChartOptions.scales,
                  y: {
                    ...lineChartOptions.scales.y,
                    title: { ...lineChartOptions.scales.y.title, text: 'Pressure (Pa)' },
                  },
                },
              }}
              style={{ height: '90%', width: '100%' }} />
          </Box>

          <Box sx={{
            p: 2, boxShadow: 3, borderRadius: 2, border: '1px solid #ccc', backgroundColor: '#fff', width: '800px', // Set width here
            height: '450px'
          }}>
            <Typography variant="h6">Force</Typography>
            <Line
              data={forceData}
              options={{
                ...lineChartData,
                ...lineChartOptions,
                scales: {
                  ...lineChartOptions.scales,
                  y: {
                    ...lineChartOptions.scales.y,
                    title: { ...lineChartOptions.scales.y.title, text: 'Force (N)' },
                  },
                },
              }}
              style={{ height: '90%', width: '100%' }} />
          </Box>

          {/* <Box sx={{ p: 2, boxShadow: 3, borderRadius: 2, border: '1px solid #ccc', backgroundColor: '#fff',width: '800px', // Set width here
    height: '450px' }}>
            <Typography variant="h6">Cycle Count</Typography>
            <Line
              data={cycleData}
              options={{
                ...lineChartData,
                ...lineChartOptions,
                scales: {
                  ...lineChartOptions.scales,
                  y: {
                    ...lineChartOptions.scales.y,
                    title: { ...lineChartOptions.scales.y.title, text: 'Cycle Count' },
                  },
                },
              }}
              style={{ height: '90%', width: '100%' }}/>
          </Box> */}

          <Box sx={{
            p: 2, boxShadow: 3, borderRadius: 2, border: '1px solid #ccc', backgroundColor: '#fff', width: '800px', // Set width here
            height: '450px'
          }}>
            <Typography variant="h6">Position of the Punch</Typography>
            <Line
              data={positionData}
              options={{
                ...lineChartData,
                ...lineChartOptions,
                scales: {
                  ...lineChartOptions.scales,
                  y: {
                    ...lineChartOptions.scales.y,
                    title: { ...lineChartOptions.scales.y.title, text: 'Position (mm)' },
                  },
                },
              }}
              style={{ height: '90%', width: '100%' }} />
          </Box>

          <Box sx={{ p: 2, boxShadow: 3, borderRadius: 2, border: '1px solid #ccc', backgroundColor: '#fff', gridColumn: 'span 2', height: '90%', width: '96%' }}>
            <Typography variant="h6">Combined Data Chart</Typography>
            <Box sx={{ height: '100%', width: '100%' }}> {/* Wrapper to ensure chart takes full size */}
              <Line
                data={{
                  labels: pressureData.labels, // Assuming all datasets share the same labels
                  datasets: [
                    {
                      label: 'Voltage L1-GND',
                      data: voltageData.datasets[0].data,
                      borderColor: 'rgb(75, 192, 192)',
                      fill: false,
                    },
                    {
                      label: 'Voltage L2-GND',
                      data: voltageData.datasets[1].data,
                      borderColor: 'rgb(255, 99, 132)',
                      fill: false,
                    },
                    {
                      label: 'Voltage L3-GND',
                      data: voltageData.datasets[2].data,
                      borderColor: 'rgb(54, 162, 235)',
                      fill: false,
                    },
                    {
                      label: 'Pressure',
                      data: pressureData.datasets[0].data,
                      borderColor: 'rgba(153, 102, 255, 1)',
                      fill: false,
                    },
                    {
                      label: 'Force',
                      data: forceData.datasets[0].data,
                      borderColor: 'rgba(255, 159, 64, 1)',
                      fill: false,
                    },
                    {
                      label: 'Position of Punch',
                      data: positionData.datasets[0].data,
                      borderColor: 'rgba(75, 192, 192, 1)',
                      fill: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { title: { display: true, text: "Time" } },
                    y: { title: { display: true, text: "Values" } },
                  },
                  plugins: {
                    legend: { display: true, position: "top" },
                    zoom: {
                      zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'x',
                        drag: { enabled: true },
                      },
                    },
                  },
                }}
                style={{ height: '84%', width: '100%' }}
              />
            </Box>
          </Box>


        </Box>

      </Box>
    </Box>
  );
}
