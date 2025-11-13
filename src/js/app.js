/**
 * Main application initialization
 * 
 * This module initializes the DJ decks and sets up global event handlers.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize decks and expose globally for sync functionality
    window.deck1 = new DJDeck(1);
    window.deck2 = new DJDeck(2);

    // Handle window resize
    window.addEventListener('resize', () => {
        window.deck1.resize();
        window.deck2.resize();
    });

    console.log('DJ Console initialized');
});
