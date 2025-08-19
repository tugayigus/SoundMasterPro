let currentTab = null;
let currentDomain = null;
let domainProfiles = {};
let globalVolume = 100;
let currentVolume = 100;
let hasProfile = false;
let customButtonValues = [20, 100, 300];
let previousVolume = 100;

// Utility function to normalize domain names (remove www. prefix)
function normalizeDomain(hostname) {
  return hostname?.startsWith('www.') ? hostname.substring(4) : hostname;
}


async function initialize() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];
  
  if (currentTab.url) {
    try {
      const url = new URL(currentTab.url);
      currentDomain = normalizeDomain(url.hostname);
      document.getElementById('current-domain').textContent = currentDomain;
    } catch (e) {
      currentDomain = 'Unknown';
      document.getElementById('current-domain').textContent = 'Unknown';
    }
  }
  
  const data = await chrome.storage.local.get(['globalVolume', 'domainProfiles', 'customButtonValues']);
  globalVolume = data.globalVolume || 100;
  domainProfiles = data.domainProfiles || {};
  customButtonValues = data.customButtonValues || [20, 100, 300];
  
  // Update quick buttons with custom values
  updateQuickButtons();
  
  if (domainProfiles[currentDomain]) {
    hasProfile = true;
    currentVolume = domainProfiles[currentDomain].volume;
    document.getElementById('enable-profile').checked = true;
    document.getElementById('profile-info').textContent = `Profile: ${currentVolume}%`;
  } else {
    hasProfile = false;
    currentVolume = globalVolume;
    document.getElementById('enable-profile').checked = false;
    document.getElementById('profile-info').textContent = 'Use global settings';
  }
  
  updateVolumeDisplay(currentVolume);
  document.getElementById('volume-slider').value = currentVolume;
  
}

function updateVolumeDisplay(volume) {
  document.getElementById('volume-value').textContent = volume;
  
  const slider = document.getElementById('volume-slider');
  const percentage = (volume / 300) * 100;
  slider.style.background = `linear-gradient(to right, #4a9eff 0%, #4a9eff ${percentage}%, #333 ${percentage}%, #333 100%)`;
  
  // Update active button styling
  updateActiveButton(volume);
}

function updateActiveButton(volume) {
  // Remove active class from all buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Update mute button text and active state
  const muteButton = document.querySelector('.quick-btn[data-volume="0"]');
  if (muteButton) {
    if (volume === 0) {
      muteButton.classList.add('active');
      muteButton.textContent = 'Muted';
    } else {
      muteButton.textContent = 'Mute';
    }
  }
}

function setVolume(volume, saveAsPrevious = true) {
  if (saveAsPrevious && currentVolume !== volume) {
    previousVolume = currentVolume;
  }
  currentVolume = volume;
  updateVolumeDisplay(volume);
  
  // Send volume change to content script
  chrome.tabs.sendMessage(currentTab.id, {
    action: 'setVolume',
    volume: volume
  }, (response) => {
    if (chrome.runtime.lastError) {
      // Only log actual errors, not popup closing
      if (!chrome.runtime.lastError.message.includes('message channel closed')) {
        // Try to inject content script if it's not loaded
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['content.js']
        }).then(() => {
          // Retry sending volume after injection
          setTimeout(() => {
            chrome.tabs.sendMessage(currentTab.id, {
              action: 'setVolume',
              volume: volume
            }).catch(() => {}); // Ignore errors on retry
          }, 100);
        }).catch(() => {
          // Silently ignore injection errors
        });
      }
    } else if (response) {
      // Volume set successfully
    }
  });
  
  
  // Save settings
  if (hasProfile && currentDomain && currentDomain !== 'Unknown') {
    domainProfiles[currentDomain] = { 
      volume: volume,
      createdAt: domainProfiles[currentDomain]?.createdAt || Date.now()
    };
    chrome.storage.local.set({ domainProfiles });
    document.getElementById('profile-info').textContent = `Profile: ${volume}%`;
  } else if (!hasProfile) {
    globalVolume = volume;
    chrome.storage.local.set({ globalVolume: volume });
  }
}

document.getElementById('volume-slider').addEventListener('input', (e) => {
  let volume = parseInt(e.target.value);
  
  // Magnetic snap to multiples of 50 (0, 50, 100, 150, 200, 250, 300)
  const snapTargets = [0, 50, 100, 150, 200, 250, 300];
  const snapThreshold = 3; // Snap range: ±3
  
  for (const target of snapTargets) {
    if (Math.abs(volume - target) <= snapThreshold) {
      volume = target;
      e.target.value = volume; // Update slider position
      break;
    }
  }
  
  setVolume(volume);
});

document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const volume = parseInt(btn.dataset.volume);
    
    // Special handling for mute button (volume 0)
    if (volume === 0) {
      // If currently muted (active), unmute to previous volume
      if (btn.classList.contains('active')) {
        document.getElementById('volume-slider').value = previousVolume;
        setVolume(previousVolume, false);
      } else {
        // Mute
        document.getElementById('volume-slider').value = volume;
        setVolume(volume);
      }
    } else {
      // For other buttons, just set the volume (no toggle functionality)
      document.getElementById('volume-slider').value = volume;
      setVolume(volume);
    }
  });
});

document.getElementById('enable-profile').addEventListener('change', async (e) => {
  hasProfile = e.target.checked;
  
  if (hasProfile && currentDomain && currentDomain !== 'Unknown') {
    domainProfiles[currentDomain] = { 
      volume: currentVolume,
      createdAt: Date.now()
    };
    await chrome.storage.local.set({ domainProfiles });
    document.getElementById('profile-info').textContent = `Profile: ${currentVolume}%`;
    
  } else if (!hasProfile && currentDomain) {
    delete domainProfiles[currentDomain];
    await chrome.storage.local.set({ domainProfiles });
    document.getElementById('profile-info').textContent = 'Use global settings';
    
    setVolume(globalVolume);
    document.getElementById('volume-slider').value = globalVolume;
  }
});

document.getElementById('manage-profiles').addEventListener('click', () => {
  showProfilesModal();
});

document.querySelector('.close-modal').addEventListener('click', () => {
  document.getElementById('profiles-modal').classList.add('hidden');
});

function showProfilesModal() {
  const modal = document.getElementById('profiles-modal');
  const profilesList = document.getElementById('profiles-list');
  
  profilesList.innerHTML = '';
  
  const profiles = Object.entries(domainProfiles);
  
  if (profiles.length === 0) {
    profilesList.innerHTML = '<div class="empty-profiles">No domain profiles created yet</div>';
  } else {
    profiles.forEach(([domain, profile]) => {
      const item = document.createElement('div');
      item.className = 'profile-item';
      item.innerHTML = `
        <span class="profile-domain">${domain}</span>
        <span class="profile-volume">${profile.volume}%</span>
        <button class="profile-delete" data-domain="${domain}">Delete</button>
      `;
      profilesList.appendChild(item);
    });
    
    profilesList.querySelectorAll('.profile-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const domain = btn.dataset.domain;
        delete domainProfiles[domain];
        await chrome.storage.local.set({ domainProfiles });
        
        if (domain === currentDomain) {
          hasProfile = false;
          document.getElementById('enable-profile').checked = false;
          document.getElementById('profile-info').textContent = 'Use global settings';
          setVolume(globalVolume);
          document.getElementById('volume-slider').value = globalVolume;
        }
        
        showProfilesModal();
      });
    });
  }
  
  modal.classList.remove('hidden');
}

document.getElementById('profiles-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.add('hidden');
  }
});

// Debug functionality (activate with Ctrl+Shift+D)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    const debugBtn = document.getElementById('debug-info');
    const debugPanel = document.getElementById('debug-panel');
    debugBtn.style.display = debugBtn.style.display === 'none' ? 'block' : 'none';
    debugPanel.style.display = 'none';
  }
});

document.getElementById('debug-info').addEventListener('click', () => {
  const debugPanel = document.getElementById('debug-panel');
  const debugContent = document.getElementById('debug-content');
  
  if (debugPanel.style.display === 'none') {
    chrome.tabs.sendMessage(currentTab.id, { action: 'debugInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        debugContent.innerHTML = 'No response from content script. Try refreshing the page.';
        return;
      }
      if (response) {
        debugContent.innerHTML = `
          <strong>Debug Information:</strong><br>
          Current Volume: ${response.currentVolume}%<br>
          Media Elements: ${response.mediaCount}<br>
          Gain Nodes: ${response.gainNodesCount}<br>
          <br>
          <strong>Elements:</strong><br>
          ${response.elements.map(el => `
            ${el.tagName} - Volume: ${(el.volume * 100).toFixed(0)}% - Muted: ${el.muted} - Has Gain: ${el.hasGainNode}<br>
            Src: ${el.src ? el.src.substring(0, 50) + '...' : 'No source'}<br>
          `).join('<br>')}
        `;
      } else {
        debugContent.innerHTML = 'No response from content script. Try refreshing the page.';
      }
      debugPanel.style.display = 'block';
    });
  } else {
    debugPanel.style.display = 'none';
  }
});

// Inline editing functionality
let editMode = false;

document.getElementById('toggle-edit-mode').addEventListener('click', () => {
  editMode = !editMode;
  const container = document.querySelector('.container');
  const button = document.getElementById('toggle-edit-mode');
  
  if (editMode) {
    container.classList.add('edit-mode');
    button.textContent = '💾 Save Changes';
    button.style.background = '#4a9eff';
    button.style.color = 'white';
    
    // Show edit indicator
    const indicator = document.createElement('div');
    indicator.className = 'edit-mode-indicator';
    indicator.textContent = '✏️ Edit Mode';
    indicator.style.cursor = 'pointer';
    indicator.addEventListener('click', () => {
      // Trigger the same save functionality as the main button
      document.getElementById('toggle-edit-mode').click();
    });
    document.body.appendChild(indicator);
  } else {
    container.classList.remove('edit-mode');
    button.textContent = 'Edit Quick Buttons';
    button.style.background = '';
    button.style.color = '';
    
    // Remove edit indicator
    const indicator = document.querySelector('.edit-mode-indicator');
    if (indicator) indicator.remove();
    
    // Save changes
    saveButtonChanges();
  }
});

// Handle button clicks in edit mode
document.querySelectorAll('.editable-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (editMode) {
      e.preventDefault();
      e.stopPropagation();
      startInlineEdit(btn);
    }
  });
});

function startInlineEdit(button) {
  const container = button.parentElement;
  const input = container.querySelector('.btn-edit-input');
  const currentValue = parseInt(button.dataset.volume);
  
  // Set input value and show it
  input.value = currentValue;
  input.style.display = 'block';
  button.style.display = 'none';
  input.focus();
  input.select();
  
  // Handle input events
  const finishEdit = () => {
    const newValue = parseInt(input.value);
    if (newValue >= 1 && newValue <= 300) {
      button.dataset.volume = newValue;
      button.textContent = `${newValue}%`;
      
      // Update in customButtonValues array
      const index = parseInt(input.dataset.index) - 1;
      customButtonValues[index] = newValue;
    }
    
    input.style.display = 'none';
    button.style.display = 'block';
  };
  
  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finishEdit();
    } else if (e.key === 'Escape') {
      input.value = currentValue;
      finishEdit();
    }
  });
}

function saveButtonChanges() {
  // Save to storage
  chrome.storage.local.set({ customButtonValues });
  
  // Update button functionality
  updateQuickButtons();
}

function updateQuickButtons() {
  const editableButtons = document.querySelectorAll('.editable-btn');
  editableButtons.forEach((btn, index) => {
    if (index < customButtonValues.length) {
      const value = customButtonValues[index];
      btn.dataset.volume = value;
      btn.textContent = `${value}%`;
    }
  });
}

initialize();