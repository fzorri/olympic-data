window.App = window.App || {};

App.Main = (function() {
    var currentTab = 'physical';

    function init() {
        // Initialize modules
        App.Graph.init();
        App.UI.init();
        App.Filters.init();
        
        // Initialize geographic module only when needed
        initTabSwitching();
        
        App.Filters.apply(); // Initial data load
    }
    
    function initTabSwitching() {
        // Add event listeners to tab buttons
        var tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                var tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
    }
    
    function switchTab(tabId) {
        if (currentTab === tabId) return;
        
        console.log("Switching to tab:", tabId);
        
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(function(button) {
            button.classList.remove('active');
        });
        document.querySelector('[data-tab="' + tabId + '"]').classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(function(pane) {
            pane.classList.remove('active');
        });
        document.getElementById(tabId + '-tab').classList.add('active');
        
        // Handle specific tab initialization
        if (tabId === 'geographic' && (!App.Geographic || !App.Geographic.initialized)) {
            // Initialize geographic module on first access
            if (typeof App.Geographic !== 'undefined' && App.Geographic.init) {
                App.Geographic.init();
                // Update with current filtered data
                setTimeout(function() {
                    if (App.Geographic && App.Geographic.initialized) {
                        App.Geographic.updateMap(App.State.currentFilteredIndices);
                    }
                }, 200);
            }
        }
        
        // Update the current visualization when switching tabs
        if (tabId === 'physical') {
            // Ensure the physical graph is updated
            if (typeof App.Graph !== 'undefined' && App.Graph.render) {
                console.log("Updating physical graph");
                App.Graph.render(App.State.currentFilteredIndices);
            }
        }
        
        currentTab = tabId;
    }

    // Public API
    return {
        init: init,
        switchTab: switchTab
    };

})();

// Initialize the app once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', App.Main.init);
