// State management
const state = {
  domainProfiles: {},
  globalVolume: 100
};


// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ 
    globalVolume: 100,
    domainProfiles: {}
  });
});

// Reset global volume on browser startup (preserve domain profiles)
chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get('domainProfiles');
  const profiles = data.domainProfiles || {};
  
  await chrome.storage.local.set({ 
    globalVolume: 100,
    domainProfiles: profiles 
  });
  
  // Update local state
  state.globalVolume = 100;
  state.domainProfiles = profiles;
});

// Load initial data from storage
chrome.storage.local.get(['globalVolume', 'domainProfiles'], (data) => {
  state.globalVolume = data.globalVolume || 100;
  state.domainProfiles = data.domainProfiles || {};
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'local') return;
  
  if (changes.globalVolume) {
    state.globalVolume = changes.globalVolume.newValue;
  }
  
  if (changes.domainProfiles) {
    state.domainProfiles = changes.domainProfiles.newValue || {};
  }
});


