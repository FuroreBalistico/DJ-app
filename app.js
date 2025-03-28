/**
 * Main application initialization
 * 
 * This module initializes the DJ decks and sets up global event handlers.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize decks
    const deck1 = new DJDeck(1);
    const deck2 = new DJDeck(2);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        deck1.resize();
        deck2.resize();
    });
    
    console.log('DJ Console initialized');
});
