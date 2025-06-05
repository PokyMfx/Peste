const prices = {
  "Rechin": 10000, "Anghila": 4200, "Baracuda": 3850,
  "Spada": 7500, "Calcan": 3500, "Tipar": 4550,
  "Nisetru": 4025, "Dorada": 2345, "Piranha": 4900,
  "Ton": 8000, "Scrumbie": 2520, "Merluciu": 2800,
  "Gunoi": 0
};

const weights = {
  "Rechin": 50, "Anghila": 2, "Baracuda": 8,
  "Spada": 35, "Calcan": 5, "Tipar": 3,
  "Nisetru": 20, "Dorada": 5, "Piranha": 0.5,
  "Ton": 30, "Scrumbie": 0.5, "Merluciu": 10,
  "Gunoi": 1
};

// Special fish for the second table
const specialFish = [
  { name: "Pesti mici/mari", price: 2000 },
  { name: "Guvizi", price: 400 },
  { name: "Pestisori Aurii", price: 8000 },
  { name: "Pesti Medii", price: 700 }
];

const fishNames = Object.keys(prices);
const fishListContainer = document.getElementById("fishList");
const fishListContainer2 = document.getElementById("fishList2");
const cashTab = document.getElementById("cashTab");
const cashTab2 = document.getElementById("cashTab2");
const cashTab3 = document.getElementById("cashTab3");
const resetButton = document.getElementById("resetButton");
const resetButton2 = document.getElementById("resetButton2");

function formatMoney(value) {
  if (isNaN(value)) return 'Bani';
  const intVal = Math.floor(value);
  return '$' + intVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatWeight(value) {
  return isNaN(value) ? '' : (Number.isInteger(value) ? value + " kg" : value.toFixed(2) + " kg");
}

function saveState() {
  const appData = {
    fishData: {
      table1: {},
      table2: {}
    },
    weights: {},
    cash: {}
  };
  
  // Save first table
  document.querySelectorAll("#fishList .fish-item").forEach(item => {
    const name = item.querySelector(".name").textContent;
    const count = parseInt(item.querySelector("input").value) || 0;
    if (name === 'Gunoi') {
      appData.fishData.table1[name] = count;
    } else {
      appData.fishData.table1[name] = count;
      appData.fishData.table2[name] = appData.fishData.table2[name] || 0;
    }
  });
  
  // Save second table (excluding Gunoi from affecting first table)
  document.querySelectorAll("#fishList2 .fish-item").forEach(item => {
    const name = item.querySelector(".name").textContent;
    const count = parseInt(item.querySelector("input").value) || 0;
    appData.fishData.table2[name] = count;
  });
  
  // Save weights and cash values
  const maxWeightInput = document.getElementById('maxWeightInput');
  const andreiCashInput = document.getElementById('andreiCash');
  const mihaiCashInput = document.getElementById('mihaiCash');
  const targetCashInput = document.getElementById('targetCash');
  
  if (maxWeightInput) appData.weights.maxWeight = maxWeightInput.value || '0';
  if (andreiCashInput) appData.cash.andrei = andreiCashInput.value || '0';
  if (mihaiCashInput) appData.cash.mihai = mihaiCashInput.value || '0';
  if (targetCashInput) appData.cash.target = targetCashInput.value || '0';
  
  console.log('Saving app data:', appData);
  localStorage.setItem('appData', JSON.stringify(appData));
}

function loadState() {
  const saved = localStorage.getItem('appData');
  if (!saved) return;
  
  let appData;
  try {
    appData = JSON.parse(saved);
    
    // Handle old format or missing data
    if (!appData.fishData) {
      appData = {
        fishData: {
          table1: appData.table1 || appData || {},
          table2: appData.table2 || appData || {}
        },
        weights: appData.weights || {},
        cash: appData.cash || {}
      };
    }
  } catch (e) {
    console.error('Error parsing app data:', e);
    return;
  }
  
  // Load fish data if it exists
  if (appData.fishData) {
    // Load first table
    document.querySelectorAll("#fishList .fish-item").forEach(item => {
      const name = item.querySelector(".name").textContent;
      const input = item.querySelector("input");
      const value = appData.fishData.table1[name] !== undefined ? 
                  parseInt(appData.fishData.table1[name]) || 0 : 0;
      input.value = value;
      updateItem(item, value);
    });
    
    // Load second table
    document.querySelectorAll("#fishList2 .fish-item").forEach(item => {
      const name = item.querySelector(".name").textContent;
      const input = item.querySelector("input");
      const value = appData.fishData.table2[name] !== undefined ? 
                  parseInt(appData.fishData.table2[name]) || 0 : 0;
      input.value = value;
      updateItem(item, value);
    });
  }
  
  // Load weights and cash values
  if (appData.weights) {
    const maxWeightInput = document.getElementById('maxWeightInput');
    if (maxWeightInput && appData.weights.maxWeight) {
      maxWeightInput.value = appData.weights.maxWeight;
    }
  }
  
  if (appData.cash) {
    const andreiCashInput = document.getElementById('andreiCash');
    const mihaiCashInput = document.getElementById('mihaiCash');
    const targetCashInput = document.getElementById('targetCash');
    
    if (andreiCashInput && appData.cash.andrei !== undefined) andreiCashInput.value = appData.cash.andrei;
    if (mihaiCashInput && appData.cash.mihai !== undefined) mihaiCashInput.value = appData.cash.mihai;
    if (targetCashInput && appData.cash.target !== undefined) targetCashInput.value = appData.cash.target;
  }
  
  // Update UI
  updateTotalCash();
  updateChart();
  updateSecondTable();
}

function updateItem(container, val) {
  const name = container.querySelector(".name").textContent;
  const moneyDiv = container.querySelector(".money");
  const weightDiv = container.querySelector(".greutate");
  
  // Calculate money based on which table we're in
  let money = 0;
  if (prices[name] !== undefined) {
    money = val * prices[name];
  } else {
    // Handle special fish from the second table
    const special = specialFish.find(fish => fish.name === name);
    if (special) {
      money = val * special.price;
    }
  }
  
  moneyDiv.textContent = formatMoney(money);
  moneyDiv.setAttribute("data-value", money);
  
  // Only update weight if the element exists
  if (weightDiv) {
    const weight = val * (weights[name] || 0);
    weightDiv.textContent = formatWeight(weight);
  }
}

function updateTotalCash() {
  // Calculate first table total (Avansat)
  let total1 = 0;
  let totalFishCount = 0;
  
  document.querySelectorAll("#fishList .fish-item").forEach(item => {
    const name = item.querySelector(".name").textContent;
    const count = parseInt(item.querySelector("input").value) || 0;
    
    // Update total fish count (for Pesti dati)
    if (name !== 'Gunoi') {
      totalFishCount += count;
    }
    
    // Calculate total cash
    if (name === 'Gunoi') {
      total1 += count * (prices[name] || 0);
    } else {
      total1 += count * (prices[name] || 0);
    }
  });
  
  // Update Pesti dati display
  const totalFishCountDiv = document.getElementById("totalFishCount");
  const fishCountDisplay = document.getElementById("fishCountDisplay");
  if (totalFishCountDiv) totalFishCountDiv.textContent = `Pesti dati: ${totalFishCount}`;
  if (fishCountDisplay) fishCountDisplay.textContent = totalFishCount;

  // Calculate second table total (Normal)
  let total2 = 0;
  document.querySelectorAll("#fishList2 .fish-item").forEach(item => {
    const name = item.querySelector(".name").textContent;
    const fish = specialFish.find(f => f.name === name);
    if (fish) {
      const count = parseInt(item.querySelector("input").value) || 0;
      // Only count Gunoi in the second table if it's a special fish
      if (name !== 'Gunoi') {
        total2 += count * fish.price;
      } else {
        // Handle Gunoi in the second table separately if needed
        total2 += count * (fish.price || 0);
      }
    }
  });

  // Calculate combined total (excluding Gunoi from second table if it's a special fish)
  let totalCombined = total1 + total2;

  // Update all three displays
  if (cashTab) cashTab.textContent = `Total Cash Avansat: ${formatMoney(total1)}`;
  if (cashTab2) cashTab2.textContent = `Total Cash Normal: ${formatMoney(total2)}`;
  if (cashTab3) cashTab3.textContent = `Total Cash: ${formatMoney(totalCombined)}`;

  // Also update the money data attributes for backward compatibility
  document.querySelectorAll(".money").forEach(el => {
    const value = parseInt(el.getAttribute("data-value")) || 0;
    el.setAttribute("data-value", value);
  });

  // Update target percentage based on 'Bani impachetati' and target
  const targetCashInput = document.getElementById('targetCash');
  const percentageDisplay = document.getElementById('percentageDisplay');
  const andreiCashInput = document.getElementById('andreiCash');
  const mihaiCashInput = document.getElementById('mihaiCash');
  
  if (targetCashInput && percentageDisplay && andreiCashInput && mihaiCashInput) {
    // Parse values, handling currency formatting ($1.000,00 or 1,000.00)
    const parseValue = (value) => {
      if (!value) return 0;
      // Remove all non-digit characters except decimal point and comma
      let str = value.toString().replace(/[^0-9.,]/g, '');
      // If last comma is after last dot, treat as decimal separator
      const lastDot = str.lastIndexOf('.');
      const lastComma = str.lastIndexOf(',');
      
      if (lastComma > lastDot) {
        // Comma is decimal separator, remove dots and replace comma with dot
        str = str.replace(/\./g, '').replace(',', '.');
      } else if (lastDot > lastComma) {
        // Dot is decimal separator, remove all commas
        str = str.replace(/,/g, '');
      } else {
        // No decimal separator, just clean the number
        str = str.replace(/[^0-9]/g, '');
      }
      
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };
    
    const targetValue = parseValue(targetCashInput.value);
    const andreiCash = parseValue(andreiCashInput.value);
    const mihaiCash = parseValue(mihaiCashInput.value);
    const totalPackedCash = andreiCash + mihaiCash;
    
    // Update percentage display with color coding
    if (targetValue > 0) {
      const percentage = Math.min(100, (totalPackedCash / targetValue) * 100);
      
      if (percentage >= 100) {
        percentageDisplay.textContent = 'Target atins! 🎉';
        percentageDisplay.style.color = '#4caf50';
        percentageDisplay.style.fontWeight = 'bold';
      } else if (percentage >= 50) {
        percentageDisplay.textContent = `${Math.round(percentage)}% din target`;
        percentageDisplay.style.color = '#ff9800';
        percentageDisplay.style.fontWeight = 'normal';
      } else {
        percentageDisplay.textContent = `${Math.round(percentage)}% din target`;
        percentageDisplay.style.color = '#f44336';
        percentageDisplay.style.fontWeight = 'normal';
      }
      
      return { total1, total2, totalCombined, totalPackedCash, percentage };
    } else {
      percentageDisplay.textContent = '0% din target';
      percentageDisplay.style.color = '#f44336';
      percentageDisplay.style.fontWeight = 'normal';
      return { total1, total2, totalCombined, totalPackedCash: 0, percentage: 0 };
    }
  }
  
  return { total1, total2, totalCombined, totalPackedCash: 0, percentage: 0 };
}

function changeValue(button, delta) {
  const input = button.parentElement.querySelector("input");
  const container = button.closest(".fish-item");
  const val = Math.max(0, (parseInt(input.value) || 0) + delta);
  input.value = val;
  updateItem(container, val);
  updateTotalCash();
  updateChart();
  saveState();
  
  // Force update the input field to ensure the value is set
  input.dispatchEvent(new Event('change'));
}

function manualInputChange(input) {
  const val = Math.max(0, parseInt(input.value) || 0);
  input.value = val;
  const container = input.closest(".fish-item");
  updateItem(container, val);
  updateTotalCash();
  updateChart();
  saveState();
  
  // Force update the input field to ensure the value is set
  input.dispatchEvent(new Event('change'));
}

resetButton.addEventListener("click", () => {
  document.querySelectorAll("#fishList .fish-item").forEach(item => {
    const input = item.querySelector("input");
    input.value = 0;
    updateItem(item, 0);
  });
  updateTotalCash();
  updateChart();
  saveState();
});

resetButton2.addEventListener("click", () => {
  document.querySelectorAll("#fishList2 .fish-item").forEach(item => {
    const input = item.querySelector("input");
    input.value = 0;
    updateItem(item, 0);
  });
  updateTotalCash();
  saveState();
});

// Function to create a fish item element with optimized event listeners
function createFishItem(name, showWeight = true) {
  const item = document.createElement("div");
  item.className = "fish-item";
  const weightHtml = showWeight ? '<div class="greutate">0 kg</div>' : '';
  
  item.innerHTML = `
    <div class="name">${name}</div>
    <div class="counter">
      <button type="button" class="decrement-btn" data-name="${name}">-</button>
      <input type="number" value="0" min="0" data-name="${name}" />
      <button type="button" class="increment-btn" data-name="${name}">+</button>
    </div>
    ${weightHtml}
    <div class="money" data-value="0">$0</div>
  `;
  
  // Add event listeners
  const input = item.querySelector('input');
  const decrementBtn = item.querySelector('.decrement-btn');
  const incrementBtn = item.querySelector('.increment-btn');
  const fishName = item.querySelector('.name').textContent;
  
  // Check if this is from the second table and is Gunoi (which should update the chart)
  const isSecondTableGunoi = item.closest('#fishList2') !== null && fishName === 'Gunoi';
  
  const updateValue = (value) => {
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(0, currentValue + value);
    if (newValue !== currentValue) {
      input.value = newValue;
      updateItem(item, newValue);
      updateTotalCash();
      updateChart(); // Update chart for any fish count change
      saveState();
    }
  };
  
  input.addEventListener('input', () => {
    const value = parseInt(input.value) || 0;
    updateItem(item, value);
    updateTotalCash();
    updateChart(); // Update chart for any input change
    saveState();
  });
  
  decrementBtn.addEventListener('click', () => {
    updateValue(-1);
    // updateTotalCash() is already called inside updateValue()
  });
  
  incrementBtn.addEventListener('click', () => {
    updateValue(1);
    // updateTotalCash() is already called inside updateValue()
  });
  
  return item;
}

// Create items for the first table
fishNames.forEach(name => {
  fishListContainer.appendChild(createFishItem(name, true));
});

// Create items for the second table
specialFish.forEach(fish => {
  fishListContainer2.appendChild(createFishItem(fish.name, false));
});

// Chart initialization with performance optimizations
const ctx = document.getElementById('dropRateChart').getContext('2d');
const dropRateChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: fishNames,
    datasets: [{
      label: 'Drop Rate (%)',
      data: Array(fishNames.length).fill(0),
      backgroundColor: 'rgba(144, 238, 144, 0.7)',
      borderColor: 'rgba(144, 238, 144, 1)',
      borderWidth: 1,
      categoryPercentage: 0.8,
      barPercentage: 0.9
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
      easing: 'easeOutQuad',
      animateScale: false,
      animateRotate: false
    },
    elements: {
      bar: {
        borderRadius: 2
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { 
          color: '#ddd', 
          callback: val => val + '%',
          maxTicksLimit: 6
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        }
      },
      x: {
        ticks: { 
          color: '#ddd',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 20
        },
        grid: { 
          display: false,
          drawBorder: false
        }
      }
    },
    plugins: {
      legend: { 
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { 
          size: 12,
          weight: 'bold' 
        },
        bodyFont: { 
          size: 11 
        },
        padding: 8,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.parsed.y}%`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    layout: {
      padding: {
        top: 5,
        right: 5,
        bottom: 5,
        left: 5
      }
    }
  }
});

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function to limit how often a function can be called
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Function to get fish counts from the first table
function getFishCounts() {
  return fishNames.map(name => {
    const item = [...document.querySelectorAll("#fishList .fish-item")].find(
      el => el.querySelector(".name").textContent === name
    );
    return item ? parseInt(item.querySelector("input").value) || 0 : 0;
  });
}

// Optimized chart update function
const updateChart = debounce(() => {
  if (!window.dropRateChart) return; // Ensure chart exists
  
  // Use requestAnimationFrame for smoother animations
  requestAnimationFrame(() => {
    // Get fish counts from first table for the chart
    const counts = getFishCounts();
    
    const total = Math.max(1, counts.reduce((a, b) => a + b, 0)); // Prevent division by zero
    const percentages = counts.map(c => ((c / total) * 100).toFixed(2));
    
    // Only update chart data if it has changed
    const dataChanged = !dropRateChart.data.datasets[0].data.every((val, i) => val === percentages[i]);
    
    if (dataChanged) {
      // Update chart with fish data from first table
      dropRateChart.data.labels = fishNames;
      dropRateChart.data.datasets[0].data = percentages;
      
      // Update with minimal animations
      dropRateChart.update({
        duration: 0, // No animation
        lazy: true,
        easing: 'easeOutQuart'
      });
    }
    
    // Calculate total weight (only from first table)
    let totalWeight = 0;
    fishNames.forEach((name, index) => {
      totalWeight += counts[index] * (weights[name] || 0);
    });
    
    const maxWeight = parseFloat(document.getElementById("maxWeightInput")?.value) || 0;
    const remainingWeight = Math.max(0, maxWeight - totalWeight);
    const progressFill = document.getElementById("progressFill");
    const weightStatus = document.getElementById("weightStatus");
    
    // Update progress bar
    const progress = maxWeight > 0 ? Math.min(totalWeight / maxWeight, 1) : 0;
    
    // Calculate remaining weight percentage
    const remainingPercentage = (1 - progress) * 100;
    
    // Update weight progress bar
    const weightProgressBar = document.getElementById('weightProgressFill');
    if (weightProgressBar) {
      weightProgressBar.style.width = `${progress * 100}%`;
      
      // Set color based on remaining weight percentage
      if (remainingPercentage >= 50) {
        // Green for 50-100% remaining
        weightProgressBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
      } else if (remainingPercentage >= 20) {
        // Yellow for 20-49% remaining
        weightProgressBar.style.background = 'linear-gradient(90deg, #FFC107, #FFA000)';
      } else {
        // Red for 0-19% remaining
        weightProgressBar.style.background = 'linear-gradient(90deg, #F44336, #D32F2F)';
      }
    }
    
    // Update weight status
    if (weightStatus) {
      weightStatus.textContent = `Greutate rămasă: ${remainingWeight.toFixed(2)} kg`;
      
      // Set text color to match progress bar
      if (remainingPercentage >= 50) {
        weightStatus.style.color = '#4CAF50'; // Green
      } else if (remainingPercentage >= 20) {
        weightStatus.style.color = '#FFA000'; // Orange
      } else {
        weightStatus.style.color = '#F44336'; // Red
      }
    }
  });
}, 50); // 50ms debounce time

// Function to update second table fish count
function updateSecondTable() {
  const counts2 = specialFish.map(fish => {
    const item = [...document.querySelectorAll("#fishList2 .fish-item")].find(el => el.querySelector(".name").textContent === fish.name);
    return item ? parseInt(item.querySelector("input").value) || 0 : 0;
  });
  const totalCount2 = counts2.reduce((a, b) => a + b, 0);
  const totalFishCountDiv2 = document.getElementById("totalFishCount2");
  if (totalFishCountDiv2) {
    totalFishCountDiv2.textContent = `Pesti dati: ${totalCount2}`;
  }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  loadState();
  
  // Set up input event listeners
  const maxWeightInput = document.getElementById('maxWeightInput');
  const andreiCashInput = document.getElementById('andreiCash');
  const mihaiCashInput = document.getElementById('mihaiCash');
  const targetCashInput = document.getElementById('targetCash');
  
  // Format number with thousand separators
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Format input on blur
  const formatInput = (input) => {
    const value = input.value.replace(/\./g, '');
    if (value) {
      const number = parseFloat(value.replace(/,/g, '.'));
      if (!isNaN(number)) {
        input.value = formatNumber(Math.round(number));
      }
    }
    updateTotalCash();
    saveState();
  };

  // Add event listeners
  [andreiCashInput, mihaiCashInput, targetCashInput].forEach(input => {
    if (input) {
      // Format on blur
      input.addEventListener('blur', () => formatInput(input));
      // Update on input
      input.addEventListener('input', () => {
        updateTotalCash();
        saveState();
      });
    }
  });

  // For max weight input
  if (maxWeightInput) {
    maxWeightInput.addEventListener('input', () => {
      updateTotalCash();
      updateChart();
      saveState();
    });
  }
  
  // Initial UI updates
  updateTotalCash();
  updateChart();
  updateSecondTable();
});

// Handle window resize
function handleResize() {
  if (dropRateChart) {
    // Force chart to recalculate its size
    dropRateChart.resize();
    dropRateChart.update();
  }
}

// Initialize the page
window.addEventListener('load', function() {
  loadState();
  updateTotalCash();
  updateChart();
  handleResize();
  window.addEventListener('resize', handleResize);
});

updateChart();
