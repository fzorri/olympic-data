// Initialize Global App Namespace
window.App = window.App || {};

/**
 * Application Configuration
 * Centralized location for all magic numbers and configurable constants
 */
App.Config = {
    // ============================================================================
    // GRAPH / SCATTER PLOT CONFIGURATION
    // ============================================================================
    
    // SVG Canvas dimensions
    SVG_WIDTH: 740,
    SVG_HEIGHT: 480,
    
    // Scale and positioning
    SCALE_FACTOR: 5,
    BASE_LEFT: 20,      // Left margin in pixels
    BASE_BOTTOM: 45,    // Bottom margin in pixels
    
    // Data ranges for axes
    MIN_HEIGHT: 137,    // Minimum height in cm
    MAX_HEIGHT: 230,    // Maximum height in cm for grid
    HEIGHT_STEP: 10,    // Height grid line interval
    
    MIN_WEIGHT: 28,     // Minimum weight in kg
    MAX_WEIGHT: 180,    // Maximum weight in kg for grid
    WEIGHT_STEP: 10,    // Weight grid line interval
    
    // BMI Zone thresholds (WHO standards)
    BMI_ZONES: [
        { val: 18.5, color: "#88cc88", label: "Bajo Peso" },
        { val: 25,   color: "#8888cc", label: "Normal" },
        { val: 30,   color: "#cc8888", label: "Sobrepeso" },
        { val: 40,   color: "#cc4444", label: "Obesidad" }
    ],
    
    // BMI Zone label positions
    BMI_LABELS: [
        { text: "Bajo Peso", h: 210, w: 70, color: "#88cc88" },
        { text: "Normal", h: 210, w: 100, color: "#8888cc" },
        { text: "Sobrepeso", h: 200, w: 115, color: "#cc8888" },
        { text: "Obesidad", h: 180, w: 130, color: "#cc4444" }
    ],
    
    // Zoom and Pan settings
    ZOOM: {
        MIN_SCALE: 0.5,
        MAX_SCALE: 10,
        INTENSITY: 0.1,
        BASE_FONT_SIZE: 10,
        BMI_FONT_SIZE: 12
    },
    
    // Dot visualization
    DOT: {
        BASE_RADIUS: 4,
        SELECTED_RADIUS: 6,
        MAX_DENSITY_CLASS: 12  // o1 through o12 density classes
    },
    
    // Tooltip settings
    TOOLTIP_TIMEOUT: 5000,  // milliseconds before auto-hide
    
    // ============================================================================
    // TABLE CONFIGURATION
    // ============================================================================
    
    TABLE: {
        PAGE_SIZE: 500,              // Maximum rows per page
        PAGINATION_VISIBLE_PAGES: 5  // Number of page buttons to show
    },
    
    // ============================================================================
    // GEOGRAPHIC MAP CONFIGURATION
    // ============================================================================
    
    MAP: {
        // Initial projection settings
        SCALE: 130,
        TRANSLATE_Y_RATIO: 1.5,  // height / 1.5
        
        // Zoom settings
        MIN_ZOOM: 1,
        MAX_ZOOM: 8,
        ZOOM_DURATION: 250,      // ms for zoom animation
        RESET_DURATION: 750,     // ms for reset zoom animation
        
        // Zoom button multipliers
        ZOOM_IN_FACTOR: 1.5,
        ZOOM_OUT_FACTOR: 0.75,
        
        // Color settings
        NO_DATA_COLOR: "#f0f0f0",
        OCEAN_COLOR: "#e6f7ff",
        STROKE_COLOR: "#666666",
        STROKE_WIDTH: 0.5,
        HIGHLIGHT_STROKE_WIDTH: 1.5,
        
        // Legend dimensions
        LEGEND_WIDTH: 220,
        LEGEND_HEIGHT: 80,
        GRADIENT_BAR_WIDTH: 180,
        GRADIENT_BAR_HEIGHT: 20,
        GRADIENT_BAR_X: 20,
        GRADIENT_BAR_Y: 10,
        
        // Initialization retry settings
        INIT_DELAY: 100,         // ms before first init attempt
        RETRY_DELAY: 50,         // ms between retry attempts
        
        // Max athletes thresholds for single display
        SINGLE_ATHLETE_MAX: 1,
        FEW_ATHLETES_MAX: 10,
        SMALL_TEAM_MAX: 100,
        MEDIUM_TEAM_MAX: 1000
    },
    
    // ============================================================================
    // SEARCH CONFIGURATION
    // ============================================================================
    
    SEARCH: {
        RANGE: 10,               // Search radius for finding nearby athletes
        MAX_ATTEMPTS: 100        // Maximum iterations in spiral search
    },
    
    // ============================================================================
    // UI CONFIGURATION
    // ============================================================================
    
    UI: {
        NOTIFICATION_DURATION: 2000,  // ms for copy notification display
        DEBOUNCE_DELAY: 300           // ms for input debouncing
    }
};
