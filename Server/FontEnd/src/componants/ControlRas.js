import React, { useState, useEffect, useRef } from 'react';
import { Button, Box, Typography } from '@mui/material';
import mqtt from 'mqtt';
import './RaspberryPiControls.css';
import Appbar from './Appbar';

export default function RaspberryPiControls() {
  const MQTT_BROKER_URL = `ws://210.246.215.31:8083`;
  const MQTT_USERNAME = 'tgr';
  const MQTT_PASSWORD = 'tgr18';

  const TOPIC_SEND_FILE = 'raspberryPi/sendFile';
  const TOPIC_ANALYZE_SOUND = 'raspberryPi/analyzeSound';
  const TOPIC_SEND_AUDIO_FILE = 'raspberryPi/sendAudioFile';
  const TOPIC_STOP_WORKING = 'raspberryPi/stopWorking';
  const TOPIC_RECORD = 'raspberryPi/record';

  // UseRef to keep the same MQTT client instance
  const clientRef = useRef(null);

  useEffect(() => {
    // Create and store the MQTT client in ref
    clientRef.current = mqtt.connect(MQTT_BROKER_URL, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
    });

    const client = clientRef.current;

    client.on('connect', () => {
      console.log('Connected to MQTT Broker');
    });

    client.on('disconnect', () => {
      console.log('Disconnected from MQTT Broker');
    });

    client.on('error', (error) => {
      console.error('Connection error:', error);
    });

    return () => {
      client.end();
    };
  }, []);

  const publishMessage = (topic, message) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish(topic, JSON.stringify(message), (error) => {
        if (error) {
          console.error(`Failed to publish to ${topic}:`, error);
        } else {
          console.log(`Published to ${topic}:`, message);
        }
      });
    } else {
      console.warn('MQTT client is not connected');
    }
  };

  const handleSendFile = () => {
    publishMessage(TOPIC_SEND_FILE, { action: 'sendFile' });
    alert("Send file");
  };

  const handleAnalyzeSound = () => {
    publishMessage(TOPIC_ANALYZE_SOUND, { action: 'analyzeSound' });
    alert("Analyze sound");
  };

  const handleSendAudioFile = () => {
    publishMessage(TOPIC_SEND_AUDIO_FILE, { action: 'sendAudioFile', fileName: 'Dtmf-1.wav' });
    alert("Send audio file");
  };

  const handleStopWorking = () => {
    publishMessage(TOPIC_STOP_WORKING, { action: 'stopWorking' });
    alert("Stop working");
  };

  const handleRecord = () => {
    publishMessage(TOPIC_RECORD, { action: 'record' });
    alert("Record sound");
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: "#F2F0F0" }}>
      <Appbar />
      <Box className="button-container" sx={{ ml: 80, mt: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2F5559', fontSize: '60px' }}>
          RaspberryPI Control
        </Typography>
        <Button onClick={handleAnalyzeSound} variant="outlined" sx={{ color: '#2F5559', borderColor: '#2F5559', borderWidth: '2px' }}>
          Start Sound Analysis
        </Button>
        <Button onClick={handleSendAudioFile} variant="outlined" sx={{ color: '#2F5559', borderColor: '#2F5559', borderWidth: '2px' }}>
          Send Audio File To Server
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2F5559', fontSize: '60px' }}>
          RaspberryPI Mode
        </Typography>
        <Button onClick={handleStopWorking} variant="outlined" sx={{ color: '#2F5559', borderColor: '#2F5559', borderWidth: '2px' }}>
          Stop Working
        </Button>
        <Button onClick={handleRecord} variant="outlined" sx={{ color: '#2F5559', borderColor: '#2F5559', borderWidth: '2px' }}>
          Start Record Sound
        </Button>
      </Box>
    </Box>
  );
}
