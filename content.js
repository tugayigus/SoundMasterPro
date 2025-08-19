/**
 * Sound Master Pro Content Script
 * Manages volume control for media elements using Web Audio API
 */

// State management
const state = {
  currentVolume: 100,
  audioContext: null,
  gainNodes: new WeakMap(),
  domain: null
};

/**
 * Get or create Web Audio API context
 * @returns {AudioContext|null} Audio context or null if not supported
 */
function getAudioContext() {
  if (!state.audioContext) {
    try {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      return null;
    }
  }
  return state.audioContext;
}

/**
 * Apply volume control to a media element
 * Uses Web Audio API for precise control, with HTML5 fallback
 * @param {HTMLMediaElement} element - The audio/video element
 * @param {number} volume - Volume percentage (0-300+)
 */
function applyVolumeToElement(element, volume) {
  if (element.volume === undefined) return;

  // Store original volume for restoration
  if (!element.hasAttribute('data-original-volume')) {
    element.setAttribute('data-original-volume', element.volume.toString());
  }

  const originalVolume = parseFloat(element.getAttribute('data-original-volume'));

  try {
    // For 100%, restore original volume without Web Audio overhead
    if (volume === 100) {
      element.volume = originalVolume;
      
      // Reset existing gain node if present
      if (state.gainNodes.has(element)) {
        const gainNode = state.gainNodes.get(element);
        gainNode.gain.value = 1.0;
      }
      return;
    }

    // Use Web Audio API for other volumes
    const ctx = getAudioContext();
    if (!ctx) {
      // Fallback to HTML5 volume control
      const targetVolume = Math.min(1, (originalVolume * volume) / 100);
      element.volume = targetVolume;
      return;
    }

    // Resume suspended audio context
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create audio graph for new elements
    if (!state.gainNodes.has(element)) {
      try {
        const source = ctx.createMediaElementSource(element);
        const gainNode = ctx.createGain();
        
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        state.gainNodes.set(element, gainNode);
        
      } catch (error) {
        // MediaElementSource creation failed, use HTML5 fallback
        const targetVolume = Math.min(1, (originalVolume * volume) / 100);
        element.volume = targetVolume;
        return;
      }
    }

    // Maintain original HTML5 volume, control via gain
    element.volume = originalVolume;
    
    // Apply volume control through gain node
    const gainNode = state.gainNodes.get(element);
    const gainValue = volume / 100; // Convert percentage to multiplier
    gainNode.gain.value = gainValue;
    
  } catch (error) {
    // Ultimate fallback to HTML5 volume
    const safeVolume = Math.min(1, (originalVolume * volume) / 100);
    element.volume = safeVolume;
  }
}

/**
 * Apply volume setting to all media elements on the page
 * @param {number} volume - Volume percentage to apply
 */
function applyVolumeToAllMedia(volume) {
  state.currentVolume = volume;
  
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(element => {
    applyVolumeToElement(element, volume);
  });
}

/**
 * Monitor DOM for new media elements and apply volume settings
 */
const mediaObserver = new MutationObserver(() => {
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(element => {
    if (!element.hasAttribute('data-original-volume')) {
      applyVolumeToElement(element, state.currentVolume);
    }
  });
  
});


// Start observing for media elements
function startMediaObserver() {
  mediaObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

if (document.body) {
  startMediaObserver();
} else {
  document.addEventListener('DOMContentLoaded', startMediaObserver);
}

/**
 * Handle messages from popup and background scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const messageHandlers = {
    setVolume: ({ volume }) => {
      applyVolumeToAllMedia(volume);
      sendResponse({ success: true, appliedVolume: volume });
    },
    
    
    debugInfo: () => {
      const mediaElements = document.querySelectorAll('video, audio');
      const debugInfo = {
        currentVolume: state.currentVolume,
        mediaCount: mediaElements.length,
        audioContextState: state.audioContext ? state.audioContext.state : 'not created',
        gainNodesCount: Array.from(mediaElements).filter(el => state.gainNodes.has(el)).length,
        elements: Array.from(mediaElements).map(el => ({
          tagName: el.tagName,
          src: el.currentSrc || el.src,
          volume: el.volume,
          muted: el.muted,
          originalVolume: el.getAttribute('data-original-volume'),
          hasGainNode: state.gainNodes.has(el),
          gainValue: state.gainNodes.has(el) ? state.gainNodes.get(el).gain.value : null
        }))
      };
      sendResponse(debugInfo);
    }
  };
  
  const handler = messageHandlers[request.action];
  if (handler) {
    handler(request);
  }
  
  return true;
});

/**
 * Initialize content script
 */
function initializeContentScript() {
  // Normalize domain name (remove www. prefix)
  state.domain = window.location.hostname;
  if (state.domain.startsWith('www.')) {
    state.domain = state.domain.substring(4);
  }

  // Load volume settings from storage
  chrome.storage.local.get(['globalVolume', 'domainProfiles'], (data) => {
    const profiles = data.domainProfiles || {};
    
    // Check for direct match first
    if (profiles[state.domain]) {
      state.currentVolume = profiles[state.domain].volume;
    } else {
      // Check for parent domain match (e.g., m.instagram.com -> instagram.com)
      const parts = state.domain.split('.');
      if (parts.length > 2) {
        const parentDomain = parts.slice(-2).join('.');
        if (profiles[parentDomain]) {
          state.currentVolume = profiles[parentDomain].volume;
        } else {
          state.currentVolume = data.globalVolume || 100;
        }
      } else {
        state.currentVolume = data.globalVolume || 100;
      }
    }
    
    // Apply volume after page elements load
    setTimeout(() => {
      applyVolumeToAllMedia(state.currentVolume);
    }, 1000);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

// Apply volume to media elements that load after initial page load
window.addEventListener('load', () => {
  setTimeout(() => {
    const mediaElements = document.querySelectorAll('video, audio');
    if (mediaElements.length > 0) {
      applyVolumeToAllMedia(state.currentVolume);
    }
  }, 500);
});