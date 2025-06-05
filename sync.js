// Real-time sync functionality
console.log('Connecting to WebSocket server...');

// Get the current hostname and protocol
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;

// Create socket connection with explicit URL
const socket = io({
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket'],
  upgrade: false,
  path: '/socket.io/'
});

console.log('WebSocket connection options:', {
  url: window.location.host,
  protocol,
  host
});

// Flag to prevent update loops
let isUpdatingFromServer = false;

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server with ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});

socket.on('state', (state) => {
  console.log('Received state update:', state);
  updateUIFromState(state);
});

// Function to update UI from server state
function updateUIFromState(state) {
  if (!state) return;
  
  isUpdatingFromServer = true;
  
  // Update fish counts (first table)
  if (state.fishCounts) {
    Object.entries(state.fishCounts).forEach(([name, count]) => {
      const input = document.querySelector(`#fishList input[data-name="${name}"]`);
      if (input && parseInt(input.value) !== count) {
        input.value = count;
        const item = input.closest('.fish-item');
        if (item) updateItem(item, count);
      }
    });
  }
  
  // Update special fish counts (second table)
  if (state.specialFishCounts) {
    Object.entries(state.specialFishCounts).forEach(([name, count]) => {
      const input = document.querySelector(`#fishList2 input[data-name="${name}"]`);
      if (input && parseInt(input.value) !== count) {
        input.value = count;
        const item = input.closest('.fish-item');
        if (item) updateItem(item, count);
      }
    });
  }
  
  // Update inputs
  if (state.maxWeight !== undefined) document.getElementById('maxWeightInput').value = state.maxWeight;
  if (state.andreiCash !== undefined) document.getElementById('andreiCash').value = state.andreiCash;
  if (state.mihaiCash !== undefined) document.getElementById('mihaiCash').value = state.mihaiCash;
  if (state.targetCash !== undefined) document.getElementById('targetCash').value = state.targetCash;
  
  // Update chart if data exists and chart is initialized
  if (state.chartData) {
    try {
      if (window.dropRateChart && window.dropRateChart.data) {
        // Only update if we have data
        if (state.chartData.labels && state.chartData.labels.length > 0) {
          window.dropRateChart.data.labels = state.chartData.labels;
        }
        if (state.chartData.datasets?.[0]?.data) {
          // Initialize datasets array if it doesn't exist
          if (!window.dropRateChart.data.datasets) {
            window.dropRateChart.data.datasets = [{}];
          }
          window.dropRateChart.data.datasets[0].data = state.chartData.datasets[0].data;
          
          // Only update colors if they exist
          if (state.chartData.datasets[0].backgroundColor) {
            window.dropRateChart.data.datasets[0].backgroundColor = state.chartData.datasets[0].backgroundColor;
          }
          
          // Only update if we have data to show
          if (state.chartData.datasets[0].data.length > 0) {
            window.dropRateChart.update();
          }
        }
      } else {
        console.log('Chart not yet initialized, will update when ready');
      }
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }
  
  // Update all UI elements
  updateTotalCash();
  updateSecondTable();
  
  // Update weight display
  if (state.totalWeight !== undefined) {
    const weightStatus = document.getElementById('weightStatus');
    const maxWeight = parseFloat(document.getElementById('maxWeightInput')?.value) || 1;
    const progress = maxWeight > 0 ? Math.min(state.totalWeight / maxWeight, 1) : 0;
    const remainingWeight = Math.max(0, maxWeight - state.totalWeight);
    
    if (weightStatus) {
      weightStatus.textContent = `Greutate rămasă: ${remainingWeight.toFixed(2)} kg`;
    }
    
    const weightProgressBar = document.getElementById('weightProgressFill');
    if (weightProgressBar) {
      weightProgressBar.style.width = `${progress * 100}%`;
      
      // Update progress bar color based on remaining weight percentage
      const remainingPercentage = (1 - progress) * 100;
      if (remainingPercentage >= 50) {
        weightProgressBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
      } else if (remainingPercentage >= 20) {
        weightProgressBar.style.background = 'linear-gradient(90deg, #FFC107, #FFA000)';
      } else {
        weightProgressBar.style.background = 'linear-gradient(90deg, #F44336, #D32F2F)';
      }
    }
  }
  
  isUpdatingFromServer = false;
}

// Listen for state updates from server
socket.on('state', updateUIFromState);

// Function to send state updates to server
function updateServerState(updates) {
  if (!isUpdatingFromServer) {
    socket.emit('update', updates);
  }
}
