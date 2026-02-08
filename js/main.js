window.App = window.App || {};

App.Main = (function() {

    function init() {
        console.log("Initializing application modules.");
        App.Graph.init();
        App.UI.init();
        App.Filters.init();
        App.Filters.apply(); // Initial data load
        console.log("Initialization complete.");
    }

    // Public API
    return {
        init: init
    };

})();

// Initialize the app once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', App.Main.init);
