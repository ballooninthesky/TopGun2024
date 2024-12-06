import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem } from '@mui/material';
import Appbar from './Appbar';
import mqtt from 'mqtt';

export default function PredictionDisplay() {
  const [predictions, setPredictions] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const client = mqtt.connect('ws://210.246.215.31:8083', {
      username: 'tgr',
      password: 'tgr18'
    });

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      client.subscribe('prediction100', { qos: 0 }, (error) => {
        if (error) {
          console.error('Subscription error:', error);
        } else {
          console.log('Subscribed to prediction100');
        }
      });
    });

    client.on('message', (topic, message) => {
      if (topic === 'prediction100') {
        try {
          const data = JSON.parse(message.toString());  // Parse the JSON payload
          const timestamp = data.timestamp;  // Assuming the timestamp is in `timedate`
          const result = data.result;  // The result could be 'Normal' or 'Faulty'
          const conf = data.conf;  // The confidence score, if required

          // Add the new message to predictions
          setPredictions((prevPredictions) => [
            ...prevPredictions,
            { timestamp, result, conf }
          ]);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      }
    });

    client.on('error', (error) => {
      console.error('MQTT error:', error);
    });

    return () => {
      client.end();
    };
  }, []);

  // Calculate counts for Normal and Faulty
  const normalCount = predictions.filter(prediction => prediction.result === 'Normal').length;
  const faultyCount = predictions.filter(prediction => prediction.result === 'Faulty').length;

  const filteredPredictions = predictions.filter((prediction) => {
    if (filter === 'All') return true;
    return prediction.result === filter;
  });

  return (
    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', backgroundColor:"#F2F0F0" }}>
      <Appbar />

      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', backgroundColor:"#F2F0F0" }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2F5559', mb: 2, marginTop: '40px' }}>
          Prediction Results
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'green' }}>Normal: {normalCount}</Typography>
          <Typography variant="h6" sx={{ color: 'red' }}>Faulty: {faultyCount}</Typography>
        </Box>

        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ mb: 2, minWidth: 150 }}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Normal">Normal</MenuItem>
          <MenuItem value="Faulty">Faulty</MenuItem>
        </Select>

        <TableContainer component={Paper} sx={{ maxWidth: 600, boxShadow: 3, borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2F5559' }}>
                  Timestamp
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2F5559' }}>
                  Result
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPredictions.map((prediction, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell align="center" sx={{ fontSize: '1rem' }}>{prediction.timestamp}</TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      color: prediction.result === 'Normal' ? 'green' : 'red',
                    }}
                  >
                    {prediction.result}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
