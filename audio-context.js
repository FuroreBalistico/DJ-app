/**
 * AudioContextManager - Handles the Web Audio API context
 * 
 * This module provides a singleton to manage our AudioContext instance
 * and provides utility functions for audio-related errors.
 */
const AudioContextManager = (() => {
    // Private variables
    let audioContext = null;
    const errorDiv = document.getElementById('error-message');
    
    // Initialize on first user interaction
    document.addEventListener('click', initializeAudioContext, { once: true });
    
    /**
     * Initialize the Web Audio API context
     */
    function initializeAudioContext() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized');
        } catch (e) {
            showError("Could not initialize audio system. Please check your browser settings.");
        }
    }
    
    /**
     * Display an error message to the user
     * @param {string} message - Error message to display
     */
    function showError(message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            setTimeout(() => {
                errorDiv.textContent = '';
            }, 5000);
        }
        console.error(message);
    }
    
    // Public API
    return {
        /**
         * Get the audio context instance, initializing if needed
         * @returns {AudioContext} The audio context
         */
        getContext() {
            if (!audioContext) {
                initializeAudioContext();
            }
            return audioContext;
        },
        
        /**
         * Display an error message to the user
         * @param {string} message - Error message to display
         */
        showError,
        
        /**
         * Check if audio context is initialized
         * @returns {boolean} True if initialized
         */
        isInitialized() {
            return audioContext !== null;
        }
    };
})();
