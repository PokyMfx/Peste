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
  
  try {
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
    
    // Update inputs and trigger change events
    const updateInput = (id, value) => {
      const el = document.getElementById(id);
      if (el && el.value !== value) {
        el.value = value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    
    if (state.maxWeight !== undefined) updateInput('maxWeightInput', state.maxWeight);
    if (state.andreiCash !== undefined) updateInput('andreiCash', state.andreiCash);
    if (state.mihaiCash !== undefined) updateInput('mihaiCash', state.mihaiCash);
    if (state.targetCash !== undefined) updateInput('targetCash', state.targetCash);
    
    // Update totals display
    if (state.totalCash1) document.getElementById('cashTab').textContent = state.totalCash1;
    if (state.totalCash2) document.getElementById('cashTab2').textContent = state.totalCash2;
    if (state.totalCombined) document.getElementById('cashTab3').textContent = state.totalCombined;
    
    // Update weight status
    if (state.totalWeight !== undefined) {
      const maxWeight = parseFloat(document.getElementById('maxWeightInput')?.value) || 1;
      const remainingWeight = Math.max(0, maxWeight - state.totalWeight);
      const weightStatus = document.getElementById('weightStatus');
      if (weightStatus) {
        weightStatus.textContent = `Greutate rămasă: ${remainingWeight.toFixed(2)} kg`;
      }
      
      // Update progress bar
      const progress = maxWeight > 0 ? Math.min(state.totalWeight / maxWeight, 1) : 0;
      const progressBar = document.getElementById('weightProgressFill');
      if (progressBar) {
        progressBar.style.width = `${progress * 100}%`;
        progressBar.style.background = progress >= 1 ? '#f44336' : 
                                       progress >= 0.8 ? '#ff9800' : '#4caf50';
      }
    }
  } catch (error) {
    console.error('Error updating UI from state:', error);
  } finally {
    isUpdatingFromServer = false;
  }
  
  // Update chart if data exists and chart is initialized
  if (state.chartData) {
    // Wait for chart to be initialized
    const checkChart = setInterval(() => {
      if (window.dropRateChart) {
        clearInterval(checkChart);
        try {
          const { chartData } = state;
          
          // Update labels if they exist
          if (chartData.labels?.length > 0) {
            window.dropRateChart.data.labels = chartData.labels;
          }
          
          // Update dataset if it exists
          if (chartData.datasets?.[0]?.data) {
            // Ensure datasets array exists
            if (!window.dropRateChart.data.datasets) {
              window.dropRateChart.data.datasets = [{}];
            }
            
            // Update data
            window.dropRateChart.data.datasets[0].data = chartData.datasets[0].data;
            
            // Update background colors if they exist
            if (chartData.datasets[0].backgroundColor) {
              window.dropRateChart.data.datasets[0].backgroundColor = 
                chartData.datasets[0].backgroundColor;
            }
            
            // Only update if we have data to show
            if (chartData.datasets[0].data.length > 0) {
              window.dropRateChart.update({
                duration: 300,
                easing: 'easeOutQuad',
                lazy: true
              });
            }
          }
        } catch (error) {
          console.error('Error updating chart:', error);
        }
      }
    }, 100); // Check every 100ms for chart
    
    // Clear the interval after 5 seconds if chart never initializes
    setTimeout(() => clearInterval(checkChart), 5000);
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

// Function to send complete UI state to server
function updateServerState(updates) {
  if (isUpdatingFromServer || !socket.connected) return;
  
  // Get all fish counts from both tables
  const fishCounts = {};
  const specialFishCounts = {};
  
  document.querySelectorAll('#fishList .fish-item').forEach(item => {
    const name = item.querySelector('.name').textContent;
    const value = parseInt(item.querySelector('input').value) || 0;
    fishCounts[name] = value;
  });
  
  document.querySelectorAll('#fishList2 .fish-item').forEach(item => {
    const name = item.querySelector('.name').textContent;
    const value = parseInt(item.querySelector('input').value) || 0;
    specialFishCounts[name] = value;
  });
  
  // Get all input values
  const maxWeight = document.getElementById('maxWeightInput')?.value || '0';
  const andreiCash = document.getElementById('andreiCash')?.value || '0';
  const mihaiCash = document.getElementById('mihaiCash')?.value || '0';
  const targetCash = document.getElementById('targetCash')?.value || '0';
  
  // Calculate total weight
  let totalWeight = 0;
  document.querySelectorAll('#fishList .fish-item').forEach(item => {
    const name = item.querySelector('.name').textContent;
    const count = parseInt(item.querySelector('input').value) || 0;
    totalWeight += count * (weights[name] || 0);
  });
  
  // Get cash totals
  const totalCash1 = document.getElementById('cashTab')?.textContent || '0';
  const totalCash2 = document.getElementById('cashTab2')?.textContent || '0';
  const totalCombined = document.getElementById('cashTab3')?.textContent || '0';
  
  // Prepare complete state
  const completeState = {
    ...updates,
    fishCounts,
    specialFishCounts,
    maxWeight,
    andreiCash,
    mihaiCash,
    targetCash,
    totalWeight,
    totalCash1,
    totalCash2,
    totalCombined,
    // Include any chart data if it exists
    chartData: window.dropRateChart?.data || null
  };
  
  console.log('Sending complete state to server:', completeState);
  socket.emit('update', completeState);
}
