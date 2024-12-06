// Sidebar.js
import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TimerIcon from '@mui/icons-material/Timer';
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ModeCommentIcon from '@mui/icons-material/ModeComment';
import CodeIcon from '@mui/icons-material/Code';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (destination) => {
    if (destination === 'edit') {
      navigate('/datagrid');
    } else if (destination === 'dashboard') {
      navigate('/dashboard');
    } else if (destination === 'controlRas') {
      navigate('/controlRas');
    } else if (destination === 'logout') {
      navigate('/login');
    }else if (destination === 'sound') {
        navigate('/sound');
    }else if (destination === 'code') {
      navigate('/code');
  }else if (destination === 'status') {
        navigate('/statuspage');
    }
    setDrawerOpen(false);
  };

  return (
    <>
      <AppBar position="fixed" style={{ backgroundColor: '#2F5559' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>Dashboard Machines</Typography>
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          <ListItem button onClick={() => handleNavigation('dashboard')}>
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('edit')}>
            <ListItemIcon><TimerIcon /></ListItemIcon>
            <ListItemText primary="History" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('controlRas')}>
            <ListItemIcon><SendIcon /></ListItemIcon>
            <ListItemText primary="Control Raspberry PI" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('sound')}>
            <ListItemIcon><VolumeUpIcon /></ListItemIcon>
            <ListItemText primary="Sound" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('code')}>
            <ListItemIcon><CodeIcon /></ListItemIcon>
            <ListItemText primary="Code" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('status')}>
            <ListItemIcon><ModeCommentIcon /></ListItemIcon>
            <ListItemText primary="Status" />
          </ListItem>
          <ListItem button onClick={() => handleNavigation('logout')}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}
