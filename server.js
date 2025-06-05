const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store the current state
let appState = {
  fishCounts: {},
  maxWeight: 0,
  andreiCash: 0,
  mihaiCash: 0,
  targetCash: 0
};

// Serve static files
app.use(express.static(__dirname));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Send current state to newly connected client
  socket.emit('state', appState);
  
  // Handle state updates from clients
  socket.on('update', (newState) => {
    // Update the server state
    appState = { ...appState, ...newState };
    // Broadcast the update to all connected clients except the sender
    socket.broadcast.emit('state', appState);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
