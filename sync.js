// Real-time sync functionality
console.log('Sync script loaded');

// Use the global socket connection from index.html
const socket = window.socket;

// Make updateTotalCash available globally
window.syncUpdateTotalCash = function() {
  // This function is defined in script.js
  if (typeof updateTotalCash === 'function') {
    updateTotalCash();
  }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!socket) {
    console.error('Socket.IO connection not found');
    return;
  }

  // Listen for state updates from server
  socket.on('state', (state) => {
    console.log('Received state update:', state);
    updateUIFromState(state);
  });

  // Request initial state
  console.log('Requesting initial state from server');
  socket.emit('getState');
});

// Function to update UI from server state
function updateUIFromState(state) {
  if (!state) return;
  
  let isUpdatingFromServer = false;
  
  isUpdatingFromServer = true;
  console.log('Updating UI from state:', state);
  
  try {
    // Update max weight input
    if (state.maxWeight !== undefined) {
      const maxWeightInput = document.getElementById('maxWeightInput');
      if (maxWeightInput && maxWeightInput.value !== state.maxWeight.toString()) {
        maxWeightInput.value = state.maxWeight;
        // Trigger input event to update other dependent fields
        maxWeightInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    
    // Update cash inputs
    if (state.andreiCash !== undefined) {
      const andreiCashInput = document.getElementById('andreiCash');
      if (andreiCashInput && andreiCashInput.value !== state.andreiCash.toString()) {
        andreiCashInput.value = state.andreiCash;
        andreiCashInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    
    if (state.mihaiCash !== undefined) {
      const mihaiCashInput = document.getElementById('mihaiCash');
      if (mihaiCashInput && mihaiCashInput.value !== state.mihaiCash.toString()) {
        mihaiCashInput.value = state.mihaiCash;
        mihaiCashInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    
    if (state.targetCash !== undefined) {
      const targetCashInput = document.getElementById('targetCash');
      if (targetCashInput && targetCashInput.value !== state.targetCash.toString()) {
        targetCashInput.value = state.targetCash;
        targetCashInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    // Update fish counts (first table)
    if (state.fishCounts) {
      Object.entries(state.fishCounts).forEach(([fishName, count]) => {
        const input = document.querySelector(`#fishList input[data-fish="${fishName}"]`);
        if (input && input.value !== count.toString()) {
          input.value = count;
          // Trigger both input and change events to ensure all handlers are called
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }
    
    // Update special fish counts (second table)
    if (state.specialFishCounts) {
      Object.entries(state.specialFishCounts).forEach(([fishName, count]) => {
        const input = document.querySelector(`#fishList2 input[data-fish="${fishName}"]`);
        if (input && input.value !== count.toString()) {
          input.value = count;
          // Trigger both input and change events to ensure all handlers are called
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
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
    
    // Update totals using the sync function
    if (window.syncUpdateTotalCash) {
      window.syncUpdateTotalCash();
    }
    
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
    console.log('Received chart data update:', state.chartData);
    
    // If chart isn't ready yet, queue the update
    if (!window.dropRateChart) {
      console.log('Chart not ready, queuing update');
      const checkChart = setInterval(() => {
        if (window.dropRateChart) {
          clearInterval(checkChart);
          updateChartFromState(state);
        }
      }, 100);
      
      // Clear the interval after 5 seconds if chart never initializes
      setTimeout(() => clearInterval(checkChart), 5000);
      return;
    }
    
    // Update chart immediately if it's ready
    updateChartFromState(state);
  }
  
  // Helper function to update chart from state
  function updateChartFromState(state) {
    if (!state.chartData) {
      console.log('No chart data in state');
      return;
    }
    
    // Wait for chart to be fully initialized
    if (!window.dropRateChart || typeof window.dropRateChart.update !== 'function') {
      console.log('Chart not initialized yet, will retry in 100ms');
      setTimeout(() => updateChartFromState(state), 100);
      return;
    }
    
    try {
      const { chartData } = state;
      
      // Initialize chart data structure if needed
      if (!window.dropRateChart.data) {
        window.dropRateChart.data = { labels: [], datasets: [{}] };
      }
      
      // Update labels if they exist
      if (chartData.labels && chartData.labels.length > 0) {
        window.dropRateChart.data.labels = chartData.labels;
      }
      
      // Ensure datasets array exists
      if (!window.dropRateChart.data.datasets) {
        window.dropRateChart.data.datasets = [{}];
      }
      
      // Update dataset if it exists
      if (chartData.datasets?.[0]?.data) {
        // Initialize dataset if needed
        if (!window.dropRateChart.data.datasets[0]) {
          window.dropRateChart.data.datasets[0] = {};
        }
        
        // Update data
        window.dropRateChart.data.datasets[0].data = chartData.datasets[0].data;
        
        // Update background colors if they exist
        if (chartData.datasets[0].backgroundColor) {
          window.dropRateChart.data.datasets[0].backgroundColor = 
            chartData.datasets[0].backgroundColor;
        }
        
        console.log('Updating chart with data:', chartData.datasets[0].data);
        
        try {
          // Ensure the chart is still valid before updating
          if (window.dropRateChart && typeof window.dropRateChart.update === 'function') {
            window.dropRateChart.update({
              duration: 300,
              easing: 'easeOutQuad',
              lazy: true
            });
            console.log('Chart update successful');
          } else {
            console.log('Chart instance not ready, skipping update');
          }
        } catch (updateError) {
          console.error('Error during chart update:', updateError);
        }
      } else {
        console.log('No dataset data in chart update');
      }
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }
  
  // Update all UI elements
  if (window.syncUpdateTotalCash) {
    window.syncUpdateTotalCash();
  }
  
  // Update second table
  if (typeof updateSecondTable === 'function') {
    updateSecondTable();
  }
  
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
