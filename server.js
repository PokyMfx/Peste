const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// Configure CORS for development and production
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Log when clients connect/disconnect
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Send current state to newly connected client
  socket.emit('state', appState);
  
  // Handle state updates from clients
  socket.on('update', (newState) => {
    console.log('Received update from client:', socket.id, newState);
    
    // Update the server state with new values
    Object.keys(newState).forEach(key => {
      if (newState[key] !== undefined) {
        if (typeof newState[key] === 'object' && newState[key] !== null) {
          appState[key] = { ...(appState[key] || {}), ...newState[key] };
        } else {
          appState[key] = newState[key];
        }
      }
    });
    
    console.log('Broadcasting updated state to all clients');
    // Broadcast the update to all connected clients
    broadcastState();
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Store the complete application state
let appState = {
  // Fish counts for both tables
  fishCounts: {},
  specialFishCounts: {},
  
  // Weight and cash
  maxWeight: 0,
  andreiCash: 0,
  mihaiCash: 0,
  targetCash: 0,
  
  // Totals
  totalWeight: 0,
  totalCash1: 0,
  totalCash2: 0,
  totalCombined: 0,
  
  // Chart data
  chartData: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: []
    }]
  }
};

// Function to broadcast state to all clients
function broadcastState() {
  io.emit('state', appState);
}

// Serve static files
app.use(express.static(__dirname));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Send current state to newly connected client
  socket.emit('state', appState);
  
  // Handle state updates from clients
  socket.on('update', (newState) => {
    // Update the server state with new values
    Object.keys(newState).forEach(key => {
      if (newState[key] !== undefined) {
        if (typeof newState[key] === 'object' && newState[key] !== null) {
          appState[key] = { ...(appState[key] || {}), ...newState[key] };
        } else {
          appState[key] = newState[key];
        }
      }
    });
    
    // Broadcast the update to all connected clients
    broadcastState();
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
