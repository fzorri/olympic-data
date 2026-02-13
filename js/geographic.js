window.App = window.App || {};

App.Geographic = (function() {
    var mapContainer, svg, projection, path, countriesGroup, zoom;
    var width, height;
    var countryData = {}; // Store country data for quick lookup
    var countryFeatures = {}; // Store country features for mapping
    var currentTransform = d3.zoomIdentity; // Track current zoom/pan state
    
    function init() {
        // Add a small delay to ensure DOM is ready and tab is visible
        setTimeout(function() {
            mapContainer = document.getElementById('world-map');
            if (!mapContainer) {
                return;
            }
            
            // Check if container is visible and has dimensions
            const style = window.getComputedStyle(mapContainer);
            if (style.display === 'none' || style.visibility === 'hidden') {
                // Retry if container is not visible
                setTimeout(init, 50);
                return;
            }
            
            // Set dimensions
            width = mapContainer.offsetWidth;
            height = mapContainer.offsetHeight;
            
            // Check if dimensions are valid
            if (width <= 0 || height <= 0) {
                // Retry if dimensions are invalid
                setTimeout(init, 50);
                return;
            }
            
            // Clear any existing content
            mapContainer.innerHTML = '';
            
            // Check if d3 is available
            if (typeof d3 === 'undefined') {
                return;
            }
            
            // Create SVG
            svg = d3.select("#world-map").append("svg")
                .attr("width", width)
                .attr("height", height);
                
            // Create projection and path generator
            projection = d3.geoMercator()
                .scale(App.Config.MAP.SCALE)
                .translate([width / 2, height / App.Config.MAP.TRANSLATE_Y_RATIO]);
                
            path = d3.geoPath().projection(projection);
            
            // Create group for countries
            countriesGroup = svg.append("g").attr("class", "countries");
            
            // Initialize zoom behavior
            initZoom();
            
            // Load and draw world map
            loadWorldMap();
            
            // Add color legend with default maxCount
            addColorLegend(1);
            
            // Mark as initialized
            App.Geographic.initialized = true;
            
            // Update map with current filtered data after a short delay
            setTimeout(function() {
                if (typeof App.State !== 'undefined' && App.State.currentFilteredIndices) {
                    updateMap(App.State.currentFilteredIndices);
                }
            }, 300);
            
            // Add resize listener
            window.addEventListener('resize', handleResize);
        }, App.Config.MAP.INIT_DELAY);
    }
    
    function initZoom() {
        // Create zoom behavior
        zoom = d3.zoom()
            .scaleExtent([App.Config.MAP.MIN_ZOOM, App.Config.MAP.MAX_ZOOM]) // Min and max zoom levels
            .translateExtent([[0, 0], [width, height]])
            .on('zoom', function(event) {
                currentTransform = event.transform;
                countriesGroup.attr('transform', currentTransform);
                
                // Update grid lines and labels if they exist
                updateZoomedElements();
            });
        
        // Apply zoom to SVG
        svg.call(zoom);
        
        // Add double-click to reset zoom
        svg.on('dblclick.zoom', function() {
            resetZoom();
        });
        
        // Add reset zoom button to UI
        addResetZoomButton();
    }
    
    function updateZoomedElements() {
        // Update any elements that need to stay fixed during zoom
        // For example: grid lines, labels, etc.
        if (gridLayer) {
            gridLayer.selectAll('.grid-line')
                .attr('vector-effect', 'non-scaling-stroke');
        }
    }
    
    function resetZoom() {
        if (!svg || !zoom) return;
        
        svg.transition()
            .duration(App.Config.MAP.RESET_DURATION)
            .call(zoom.transform, d3.zoomIdentity);
    }
    
    function addColorLegend(maxCount) {
        // Create legend container
        var legend = d3.select("#geographic-container")
            .append("div")
            .attr("class", "map-legend")
            .style("left", "10px")
            .style("bottom", "20px")
            .style("top", "auto")
            .style("right", "auto");
        
        // Add title
        legend.append("div")
            .attr("class", "legend-title")
            .style("font-weight", "bold")
            .style("margin-bottom", "8px")
            .text("Athletes per Country (logarithmic scale)");
        
        // Create SVG for gradient bar
        var mapCfg = App.Config.MAP;
        var svgWidth = mapCfg.LEGEND_WIDTH;
        var svgHeight = mapCfg.LEGEND_HEIGHT;
        
        var svg = legend.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .attr("class", "gradient-legend");
        
        // Define gradient
        var defs = svg.append("defs");
        var gradient = defs.append("linearGradient")
            .attr("id", "color-gradient")
            .attr("x1", "0%")
            .attr("x2", "100%");
        
        // Add gradient stops
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", d3.interpolateYlOrRd(0));
        
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", d3.interpolateYlOrRd(1));
        
        // Draw gradient rectangle
        var barWidth = mapCfg.GRADIENT_BAR_WIDTH;
        var barHeight = mapCfg.GRADIENT_BAR_HEIGHT;
        var barX = mapCfg.GRADIENT_BAR_X;
        var barY = mapCfg.GRADIENT_BAR_Y;
        
        svg.append("rect")
            .attr("class", "gradient-bar")
            .attr("x", barX)
            .attr("y", barY)
            .attr("width", barWidth)
            .attr("height", barHeight)
            .attr("fill", "url(#color-gradient)")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);
        
        // Add no-data color sample
        var noDataY = barY + barHeight + 25;
        svg.append("rect")
            .attr("class", "no-data-sample")
            .attr("x", barX)
            .attr("y", noDataY)
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", mapCfg.NO_DATA_COLOR)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);
        
        svg.append("text")
            .attr("class", "no-data-label")
            .attr("x", barX + 20)
            .attr("y", noDataY + 9)
            .attr("font-size", "11px")
            .attr("fill", "#333")
            .text("No athletes");
        
        // Add interactive hover area
        var hoverArea = svg.append("rect")
            .attr("class", "gradient-hover")
            .attr("x", barX)
            .attr("y", barY)
            .attr("width", barWidth)
            .attr("height", barHeight)
            .attr("fill", "transparent")
            .attr("pointer-events", "all");
        
        // Add hover indicator (initially hidden)
        var hoverIndicator = svg.append("line")
            .attr("class", "hover-indicator")
            .attr("x1", barX)
            .attr("y1", barY)
            .attr("x2", barX)
            .attr("y2", barY + barHeight)
            .attr("stroke", "#000")
            .attr("stroke-width", 2)
            .attr("opacity", 0)
            .attr("pointer-events", "none");
        
        hoverArea
            .on("mousemove", function(event) {
                showGradientTooltip(event, barX, barWidth, maxCount);
                
                // Update hover indicator position
                var svgRect = event.currentTarget.getBoundingClientRect();
                var x = event.clientX - svgRect.left;
                var relativeX = (x - barX) / barWidth;
                relativeX = Math.max(0, Math.min(1, relativeX));
                
                var indicatorX = barX + (relativeX * barWidth);
                hoverIndicator
                    .attr("x1", indicatorX)
                    .attr("x2", indicatorX)
                    .attr("opacity", 0.7);
            })
            .on("mouseout", function() {
                hideGradientTooltip();
                hoverIndicator.attr("opacity", 0);
            });
        
        // Add explanatory text
        legend.append("div")
            .attr("class", "legend-explanation")
            .style("margin-top", "8px")
            .style("font-size", "10px")
            .style("color", "#666")
            .style("font-style", "italic")
            .text("Hover over gradient to see values • Click country to filter");
        
        // Initialize gradient tooltip
        initGradientTooltip();
        
        // Update with log boundaries
        updateLegend(maxCount);
    }
    
    function addResetZoomButton() {
        // Create zoom controls container
        var zoomControls = d3.select("#geographic-container")
            .append("div")
            .attr("class", "zoom-controls");
        
        // Zoom in button
        zoomControls.append("button")
            .attr("class", "zoom-btn")
            .text("+")
            .on("click", function() {
                zoomIn();
            });
        
        // Zoom out button
        zoomControls.append("button")
            .attr("class", "zoom-btn")
            .text("−")
            .on("click", function() {
                zoomOut();
            });
        
        // Reset zoom button
        d3.select("#geographic-container")
            .append("button")
            .attr("class", "reset-zoom-btn")
            .text("Reset Zoom")
            .on("click", resetZoom);
    }
    
    function zoomIn() {
        if (!svg || !zoom) return;
        
        svg.transition()
            .duration(App.Config.MAP.ZOOM_DURATION)
            .call(zoom.scaleBy, App.Config.MAP.ZOOM_IN_FACTOR);
    }
    
    function zoomOut() {
        if (!svg || !zoom) return;
        
        svg.transition()
            .duration(App.Config.MAP.ZOOM_DURATION)
            .call(zoom.scaleBy, App.Config.MAP.ZOOM_OUT_FACTOR);
    }
    
    function loadWorldMap() {
        // Check if topojson is available
        if (typeof topojson === 'undefined') {
            console.warn('TopoJSON library not available, using simple map');
            drawSimpleMap();
            return;
        }
        
        // Check if world topology data is loaded
        // First check window.worldTopology (set by world-topology-data.js)
        var topology = window.worldTopology;
        
        if (typeof topology === 'undefined' || !topology || !topology.objects) {
            console.warn('World topology data not loaded, using simple map');
            drawSimpleMap();
            return;
        }
        
        console.log('Drawing real world map with', topology.objects?.countries?.geometries?.length || 0, 'countries');
        
        // Try to draw real map with TopoJSON data
        try {
            drawRealMap(topology);
            console.log('✅ Real map drawn successfully');
        } catch (error) {
            console.error('❌ Error drawing real map:', error);
            drawSimpleMap(); // Fallback to simple map
        }
    }
    
    function drawRealMap(world) {
        try {
            // Extract country features from TopoJSON
            var countries = topojson.feature(world, world.objects.countries).features;
            
            // Clear any existing content
            countriesGroup.selectAll("*").remove();
            
            // Create a mapping of country IDs to features
            countryFeatures = {};
            for (var i = 0; i < countries.length; i++) {
                var country = countries[i];
                var key = country.id ? country.id.toString() : null;
                if (key) {
                    countryFeatures[key] = country;
                }
            }
            
            // Draw countries with proper geographic boundaries
            var countryPaths = countriesGroup.selectAll("path")
                .data(countries)
                .enter().append("path")
                .attr("class", "country")
                .attr("d", path)
                .each(function(d) {
                    var isoCode = d.id ? d.id.toString() : null;
                    if (!isoCode) return;
                    
                    var nocCode = getNOCByISO(isoCode);
                    // Initialize countryData for this country if not already done
                    if (nocCode && !countryData.hasOwnProperty(nocCode)) {
                        countryData[nocCode] = 0;
                    }
                    
                    var count = countryData[nocCode] || 0;
                    var maxCount = (App.State && App.State.currentMaxCount) || 1;
                    var color = getColorByCount(count, maxCount);
                    
                    // FORCE set all style properties
                    var mapCfg = App.Config.MAP;
                    var el = d3.select(this);
                    el.attr("fill", color)
                      .style("fill", color)
                      .style("fill-opacity", "1")
                      .style("opacity", "1")
                      .attr("fill-opacity", "1")
                      .attr("stroke", mapCfg.STROKE_COLOR)
                      .attr("stroke-width", mapCfg.STROKE_WIDTH);
                })
                .on("mouseover", function(event, d) {
                    // Highlight on hover
                    d3.select(this).attr("stroke", "#333").attr("stroke-width", App.Config.MAP.HIGHLIGHT_STROKE_WIDTH);
                    
                    // Show tooltip
                    var isoCode = d.id ? d.id.toString() : null;
                    if (isoCode) {
                        var nocCode = getNOCByISO(isoCode);
                        var count = countryData[nocCode] || 0;
                        var countryName = getCountryNameByISO(isoCode) || d.properties?.name || "Unknown";
                        showMapTooltip(event, countryName, count, nocCode);
                    }
                })
                .on("mouseout", function(event, d) {
                    // Restore stroke
                    var mapCfg = App.Config.MAP;
                    d3.select(this).attr("stroke", mapCfg.STROKE_COLOR).attr("stroke-width", mapCfg.STROKE_WIDTH);
                    
                    // Hide tooltip
                    hideMapTooltip();
                })
                .on("click", function(event, d) {
                    // Filter by country when clicked
                    var isoCode = d.id ? d.id.toString() : null;
                    if (isoCode) {
                        var nocCode = getNOCByISO(isoCode);
                        if (nocCode && nocCode !== "OTHER") {
                            filterByCountry(nocCode);
                        }
                    }
                });
            
            // Add ocean background
            svg.insert("rect", ".countries")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", App.Config.MAP.OCEAN_COLOR) // Light blue for oceans
                .attr("class", "ocean-background");
                
        } catch (error) {
            console.error("Error in drawRealMap:", error);
            throw error;
        }
    }
    
    function drawMap(world) {
        // Legacy function - redirect to drawRealMap
        drawRealMap(world);
    }
    
    function drawSimpleMap() {
        // Fallback to simple map if world data fails to load
        if (!svg) {
            return;
        }
        
        // Create a more comprehensive list of countries with their positions
        createCountryElements();
    }
    
    function createCountryElements() {
        // Create country elements based on the actual data we have
        if (typeof countryArray === 'undefined') {
            return;
        }
        
        if (!svg) {
            return;
        }
        
        // Create a simplified world map with continent shapes
        // Create oceans background
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#4fc3f7"); // Blue for oceans
            
        // Create continents with simplified shapes
        // North America
        svg.append("path")
            .attr("d", "M100,100 L200,80 L220,150 L180,180 L120,160 Z")
            .attr("fill", "#8bc34a")
            .attr("stroke", "#7cb342")
            .attr("stroke-width", 1)
            .attr("class", "continent");
            
        // South America
        svg.append("path")
            .attr("d", "M180,200 L220,180 L240,280 L200,300 L180,250 Z")
            .attr("fill", "#8bc34a")
            .attr("stroke", "#7cb342")
            .attr("stroke-width", 1)
            .attr("class", "continent");
            
        // Europe
        svg.append("path")
            .attr("d", "M300,120 L350,100 L370,130 L340,150 L310,140 Z")
            .attr("fill", "#8bc34a")
            .attr("stroke", "#7cb342")
            .attr("stroke-width", 1)
            .attr("class", "continent");
            
        // Africa
        svg.append("path")
            .attr("d", "M320,160 L380,150 L400,250 L350,270 L310,230 Z")
            .attr("fill", "#8bc34a")
            .attr("stroke", "#7cb342")
            .attr("stroke-width", 1)
            .attr("class", "continent");
            
        // Asia
        svg.append("path")
            .attr("d", "M400,80 L550,60 L580,180 L500,200 L420,150 Z")
            .attr("fill", "#8bc34a")
            .attr("stroke", "#7cb342")
            .attr("stroke-width", 1)
            .attr("class", "continent");
            
        // Australia
        svg.append("path")
            .attr("d", "M550,250 L600,240 L620,280 L580,290 Z")
            .attr("fill", "#8bc34a")
            .attr("stroke", "#7cb342")
            .attr("stroke-width", 1)
            .attr("class", "continent");
            
        // Create country markers (simplified circles)
        var countryMarkers = [
            { code: "USA", x: 150, y: 140, name: "United States" },
            { code: "CHN", x: 500, y: 150, name: "China" },
            { code: "RUS", x: 450, y: 100, name: "Russia" },
            { code: "GBR", x: 330, y: 130, name: "United Kingdom" },
            { code: "GER", x: 340, y: 140, name: "Germany" },
            { code: "FRA", x: 320, y: 150, name: "France" },
            { code: "JPN", x: 580, y: 160, name: "Japan" },
            { code: "AUS", x: 580, y: 270, name: "Australia" },
            { code: "BRA", x: 220, y: 240, name: "Brazil" },
            { code: "CAN", x: 150, y: 100, name: "Canada" }
        ];
        
        // Create country markers
        countryMarkers.forEach(function(country) {
            // Create a circle for each country
            var countryElement = svg.append("circle")
                .attr("class", "country")
                .attr("id", "country-" + country.code)
                .attr("cx", country.x)
                .attr("cy", country.y)
                .attr("r", 8)
                .attr("fill", "#ccc")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .on("mouseover", function(event) {
                    d3.select(this).attr("fill", "#999");
                })
                .on("mouseout", function(event) {
                    // Restore color based on athlete count
                    var count = countryData[country.code] || 0;
                    var color = getColorByCount(count);
                    d3.select(this).attr("fill", color);
                });
                
            // Store reference to this element
            countryData[country.code] = countryData[country.code] || 0;
        });
    }
    
    // Color cache for performance
    var colorCache = {};
    
    function clearColorCache() {
        colorCache = {};
    }
    
    function getColorByCount(count, maxCount) {
        var mapCfg = App.Config.MAP;
        
        // No data = light gray
        if (count === 0) return mapCfg.NO_DATA_COLOR;
        
        // Validate inputs
        if (typeof maxCount === 'undefined' || maxCount === null) {
            maxCount = 1;
        }
        
        // Edge case: maxCount is 0 or negative
        if (maxCount <= 0) return mapCfg.NO_DATA_COLOR;
        
        // Edge case: only 0 or 1 athletes in entire dataset
        if (maxCount <= 1) {
            return count === 1 ? "#ffffcc" : mapCfg.NO_DATA_COLOR; // Lightest yellow for single athlete
        }
        
        // Check cache first
        const cacheKey = `${count}_${maxCount}`;
        if (colorCache[cacheKey]) {
            return colorCache[cacheKey];
        }
        
        // Logarithmic scale: log10(1) = 0, log10(maxCount) = logMax
        const logCount = Math.log10(count);
        const logMax = Math.log10(maxCount);
        
        // Normalize to 0-1 range
        let intensity = logCount / logMax;
        
        // Clamp to valid range (shouldn't happen but safety)
        intensity = Math.max(0, Math.min(1, intensity));
        
        // Yellow → Orange → Red gradient (D3's YlOrRd)
        let color;
        if (typeof d3 !== 'undefined' && d3.interpolateYlOrRd) {
            color = d3.interpolateYlOrRd(intensity);
        } else {
            // Fallback implementation if D3 color scale not available
            color = fallbackYlOrRd(intensity);
        }
        
        // Cache the result
        colorCache[cacheKey] = color;
        return color;
    }
    
    // Fallback YlOrRd implementation if D3 not available
    function fallbackYlOrRd(intensity) {
        // Color stops for YlOrRd (Yellow-Orange-Red)
        const colors = [
            [255, 255, 204], // Light yellow (intensity 0)
            [255, 237, 160], // Yellow
            [254, 217, 118], // Light orange
            [254, 178, 76],  // Orange
            [253, 141, 60],  // Dark orange
            [252, 78, 42],   // Light red
            [227, 26, 28],   // Red
            [189, 0, 38]     // Dark red (intensity 1)
        ];
        
        // Map intensity to color index
        const index = Math.min(
            Math.floor(intensity * (colors.length - 1)),
            colors.length - 2
        );
        
        const nextIndex = index + 1;
        const localIntensity = (intensity * (colors.length - 1)) - index;
        
        // Interpolate between two nearest colors
        const [r1, g1, b1] = colors[index];
        const [r2, g2, b2] = colors[nextIndex];
        
        const r = Math.round(r1 + (r2 - r1) * localIntensity);
        const g = Math.round(g1 + (g2 - g1) * localIntensity);
        const b = Math.round(b1 + (b2 - b1) * localIntensity);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    function updateMap(filteredIndices) {
        // Update the map based on filtered data
        if (!svg) {
            console.log('updateMap: SVG not available');
            return;
        }
        
        // Handle case where filteredIndices is null or undefined
        if (!filteredIndices) {
            filteredIndices = [];
        }
        
        // Check if olympianArray is available
        if (typeof olympianArray === 'undefined') {
            return;
        }
        
        // Calculate athlete counts by country
        var countryCounts = {};
        filteredIndices.forEach(function(index) {
            var athlete = olympianArray[index];
            var countryCode = athlete[9]; // NOC code
            
            if (!countryCounts[countryCode]) {
                countryCounts[countryCode] = 0;
            }
            countryCounts[countryCode]++;
        });
        
        console.log('Country counts calculated:', countryCounts);
        
        // Calculate maximum count for gradient scaling
        var maxCount = 0;
        Object.values(countryCounts).forEach(function(count) {
            if (count > maxCount) maxCount = count;
        });
        
        console.log('Maximum athlete count:', maxCount);
        
        // Store for use in other functions
        App.State.currentMaxCount = maxCount;
        
        // Update legend with current max count
        updateLegend(maxCount);
        
        // Update countryData with current counts
        // First, ensure countryData has entries for all known countries
        if (Object.keys(countryFeatures).length > 0) {
            // We have real geographic data - initialize countryData for all countries
            Object.keys(countryFeatures).forEach(function(isoCode) {
                var nocCode = getNOCByISO(isoCode);
                if (nocCode) {
                    // Initialize if not exists, will be updated below
                    if (!countryData.hasOwnProperty(nocCode)) {
                        countryData[nocCode] = 0;
                    }
                }
            });
        }
        
        // Also ensure "OTHER" is initialized (for unknown countries)
        if (!countryData.hasOwnProperty("OTHER")) {
            countryData["OTHER"] = 0;
        }
        
        // Now reset ALL countryData entries to 0
        Object.keys(countryData).forEach(function(key) {
            countryData[key] = 0;
        });
        
        // Update with current counts
        Object.keys(countryCounts).forEach(function(key) {
            countryData[key] = countryCounts[key];
        });
        
        // Update country colors based on counts
        if (Object.keys(countryFeatures).length > 0) {
            // We have real geographic data (TopoJSON)
            console.log('Updating real map with', Object.keys(countryFeatures).length, 'country features');
            
            // Debug: Check Finland specifically
            var finlandInFeatures = '246' in countryFeatures;
            console.log('Finland in countryFeatures?', finlandInFeatures);
            if (!finlandInFeatures) {
                console.log('ERROR: Finland NOT in countryFeatures!');
            }
            

            
            countriesGroup.selectAll("path.country")
                .each(function(d) {
                    var isoCode = d.id ? d.id.toString() : null;
                    if (!isoCode) return;
                    
                    var nocCode = getNOCByISO(isoCode);
                    var count = countryCounts[nocCode] || 0;
                    var color = getColorByCount(count, maxCount);
                    
                    // Log Finland
                    if (isoCode === '246' || nocCode === 'FIN') {
                        console.log('Finland gradient color:', {isoCode, nocCode, count, maxCount, color});
                    }
                    
                    // Debug: Log if count is 0 but color is not gray
                    if (count === 0 && color !== "#f0f0f0") {
                        console.warn('Country with 0 athletes has non-gray color:', {
                            isoCode: isoCode,
                            nocCode: nocCode,
                            count: count,
                            color: color,
                            expected: "#f0f0f0"
                        });
                    }
                    
                    // FORCE set all style properties
                    var el = d3.select(this);
                    el.attr("fill", color)
                      .style("fill", color)
                      .style("fill-opacity", "1")
                      .style("opacity", "1")
                      .attr("fill-opacity", "1");
                });
        } else {
            // We're using the simple map (fallback)
            Object.keys(countryCounts).forEach(function(countryCode) {
                var count = countryCounts[countryCode];
                var color = getColorByCount(count, maxCount);
                var countryElement = document.getElementById("country-" + countryCode);
                if (countryElement) {
                    d3.select(countryElement).attr("fill", color);
                }
            });
            
            // Also update countries with zero counts
            var mapCfg = App.Config.MAP;
            Object.keys(countryData).forEach(function(countryCode) {
                if (!countryCounts[countryCode]) {
                    var countryElement = document.getElementById("country-" + countryCode);
                    if (countryElement) {
                        d3.select(countryElement).attr("fill", mapCfg.NO_DATA_COLOR);
                    }
                }
            });
        }
        
        // Update dashboard
        updateDashboard(filteredIndices, countryCounts);
    }
    
    function updateDashboard(filteredIndices, countryCounts) {
        // Update the geographic dashboard with statistics
        document.getElementById('geo-dash-count').innerText = filteredIndices.length;
        document.getElementById('geo-dash-countries').innerText = Object.keys(countryCounts).length;
        
        // Find top country
        var topCountry = "";
        var maxCount = 0;
        Object.keys(countryCounts).forEach(function(code) {
            if (countryCounts[code] > maxCount) {
                maxCount = countryCounts[code];
                topCountry = code;
            }
        });
        
        if (topCountry && typeof countryArray !== 'undefined') {
            // Find country name from NOC code
            var countryName = getCountryNameByNOC(topCountry);
            document.getElementById('geo-dash-top-country').innerText = countryName + ' (' + maxCount + ')';
        } else {
            document.getElementById('geo-dash-top-country').innerText = '-';
        }
        
        // Calculate total medals
        var totalMedals = 0;
        filteredIndices.forEach(function(index) {
            var athlete = olympianArray[index];
            totalMedals += (athlete[4] || 0) + (athlete[5] || 0) + (athlete[6] || 0);
        });
        document.getElementById('geo-dash-medals').innerText = totalMedals;
    }
    
    function getNOCByISO(isoCode) {
        // Handle null/undefined isoCode
        if (!isoCode) {
            return "OTHER";
        }
        
        // Convert isoCode to string for consistent lookup
        var isoCodeStr = isoCode.toString();
        
        // Convert ISO numeric code to NOC code using mapping
        // First check if mapping is available
        if (typeof ISO_TO_PRIMARY_NOC !== 'undefined' && ISO_TO_PRIMARY_NOC[isoCodeStr]) {
            return ISO_TO_PRIMARY_NOC[isoCodeStr];
        }
        
        // Fallback to simplified mapping for common countries
        var idToNOC = {
            "840": "USA", // United States
            "156": "CHN", // China
            "643": "RUS", // Russia
            "826": "GBR", // United Kingdom
            "276": "GER", // Germany
            "250": "FRA", // France
            "392": "JPN", // Japan
            "036": "AUS", // Australia
            "076": "BRA", // Brazil
            "124": "CAN", // Canada
            "380": "ITA", // Italy
            "752": "SWE", // Sweden
            "528": "NED", // Netherlands
            "246": "FIN", // Finland
            "578": "NOR", // Norway
            "724": "ESP", // Spain
            "616": "POL", // Poland
            "642": "ROU", // Romania
            "348": "HUN", // Hungary
            "804": "UKR"  // Ukraine
        };
        return idToNOC[isoCodeStr] || "OTHER";
    }
    
    function getCountryNameByISO(isoCode) {
        // Get country name from ISO code
        // First try to get NOC code, then country name from NOC
        var nocCode = getNOCByISO(isoCode);
        if (nocCode && nocCode !== "OTHER") {
            return getCountryNameByNOC(nocCode);
        }
        return null;
    }
    
    function getCountryNameByNOC(nocCode) {
        // Get country name from NOC code
        if (typeof NOC_TO_COUNTRY !== 'undefined' && NOC_TO_COUNTRY[nocCode]) {
            return NOC_TO_COUNTRY[nocCode];
        }
        
        // Fallback for common countries
        var nocToName = {
            "USA": "United States",
            "CHN": "China",
            "RUS": "Russia",
            "GBR": "United Kingdom",
            "GER": "Germany",
            "FRA": "France",
            "JPN": "Japan",
            "AUS": "Australia",
            "BRA": "Brazil",
            "CAN": "Canada",
            "ITA": "Italy",
            "ESP": "Spain",
            "NED": "Netherlands"
        };
        return nocToName[nocCode] || nocCode;
    }
    
    function showMapTooltip(event, countryName, count, nocCode) {
        // Create or update tooltip
        var tooltip = d3.select("#map-tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("id", "map-tooltip")
                .attr("class", "map-tooltip")
                .style("position", "absolute")
                .style("background", "rgba(0, 0, 0, 0.8)")
                .style("color", "white")
                .style("padding", "8px 12px")
                .style("border-radius", "4px")
                .style("font-size", "12px")
                .style("pointer-events", "none")
                .style("z-index", "1000")
                .style("display", "none");
        }
        
        // Get current max count for logarithmic context
        var maxCount = (App.State && App.State.currentMaxCount) || 1;
        
        // Set tooltip content
        var content = `<strong>${countryName}</strong><br>`;
        
        if (count > 0) {
            // Format count with commas
            var formattedCount = formatNumber(count);
            content += `<div style="display: flex; align-items: center; gap: 6px; margin: 4px 0;">
                <div style="width: 12px; height: 12px; background: ${getColorByCount(count, maxCount)}; border: 1px solid white;"></div>
                <div>
                    <strong>${formattedCount} athlete${count !== 1 ? 's' : ''}</strong>
                </div>
            </div>`;
            
            // Add logarithmic context if maxCount > 1
            if (maxCount > 1) {
                var logPosition = Math.log10(count) / Math.log10(maxCount);
                var percentile = (1 - logPosition) * 100;
                
                // Determine magnitude description using config thresholds
                var mapCfg = App.Config.MAP;
                var magnitude = "";
                if (count === mapCfg.SINGLE_ATHLETE_MAX) {
                    magnitude = "Only 1 athlete";
                } else if (count < mapCfg.FEW_ATHLETES_MAX) {
                    magnitude = "Few athletes (1-9)";
                } else if (count < mapCfg.SMALL_TEAM_MAX) {
                    magnitude = "Small team (10-99)";
                } else if (count < mapCfg.MEDIUM_TEAM_MAX) {
                    magnitude = "Medium team (100-999)";
                } else {
                    magnitude = "Large team (1,000+)";
                }
                
                content += `<div style="font-size: 11px; color: #ccc; margin-top: 4px;">
                    ${magnitude}<br>
                    <small>Log position: ${logPosition.toFixed(2)} (top ${percentile.toFixed(0)}%)</small>
                </div>`;
            }
        } else {
            var mapCfg = App.Config.MAP;
            content += `<div style="display: flex; align-items: center; gap: 6px; margin: 4px 0;">
                <div style="width: 12px; height: 12px; background: ${mapCfg.NO_DATA_COLOR}; border: 1px solid white;"></div>
                <div>No athletes</div>
            </div>`;
        }
        
        if (nocCode && nocCode !== "OTHER") {
            content += `<div style="font-size: 11px; color: #ccc; margin-top: 4px;">NOC: ${nocCode}</div>`;
        }
        
        // Add scaling explanation on first hover
        if (maxCount > 100 && !window.tooltipExplained) {
            content += `<div style="font-size: 10px; color: #aaa; margin-top: 6px; border-top: 1px solid #555; padding-top: 4px;">
                <em>Colors use logarithmic scale for wide ranges</em>
            </div>`;
            window.tooltipExplained = true;
        }
        
        tooltip.html(content)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px")
            .style("display", "block");
    }
    
    function hideMapTooltip() {
        d3.select("#map-tooltip").style("display", "none");
    }
    
    function filterByCountry(nocCode) {
        // Add a filter for this country
        if (typeof App.Filters !== 'undefined' && App.Filters.addFilter) {
            App.Filters.addFilter({
                field: 'country',
                operator: 'equals',
                value: nocCode
            });
        }
    }
    
    function handleResize() {
        if (!mapContainer) return;
        
        // Update dimensions
        width = mapContainer.offsetWidth;
        height = mapContainer.offsetHeight;
        
        // Update SVG dimensions
        if (svg) {
            svg.attr("width", width)
               .attr("height", height);
               
            // Update projection
            if (projection) {
                projection.translate([width / 2, height / 1.5]);
                // Redraw paths if they exist
                if (countriesGroup) {
                    countriesGroup.selectAll("path")
                        .attr("d", path);
                }
            }
        }
    }
    
    // Gradient tooltip functions
    function initGradientTooltip() {
        // Create gradient tooltip if it doesn't exist
        var tooltip = d3.select("#gradient-tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("id", "gradient-tooltip")
                .attr("class", "gradient-tooltip")
                .style("position", "absolute")
                .style("background", "rgba(0, 0, 0, 0.8)")
                .style("color", "white")
                .style("padding", "6px 10px")
                .style("border-radius", "4px")
                .style("font-size", "11px")
                .style("pointer-events", "none")
                .style("z-index", "1001")
                .style("display", "none");
        }
    }
    
    function showGradientTooltip(event, barX, barWidth, maxCount) {
        var tooltip = d3.select("#gradient-tooltip");
        if (tooltip.empty()) return;
        
        // Calculate position relative to gradient bar
        var svgRect = event.currentTarget.getBoundingClientRect();
        var x = event.clientX - svgRect.left;
        var relativeX = (x - barX) / barWidth;
        
        // Clamp to bar bounds
        relativeX = Math.max(0, Math.min(1, relativeX));
        
        // Calculate athlete count from logarithmic position
        // relativeX = log10(count) / log10(maxCount)
        // So: count = 10^(relativeX * log10(maxCount))
        var logCount = relativeX * Math.log10(maxCount);
        var count = Math.pow(10, logCount);
        
        // Round to appropriate precision
        if (count < 10) {
            count = Math.round(count * 10) / 10; // 1 decimal for small numbers
        } else if (count < 100) {
            count = Math.round(count); // whole numbers
        } else {
            count = Math.round(count / 10) * 10; // nearest 10 for large numbers
        }
        
        // Ensure count is at least 1
        count = Math.max(1, count);
        
        // Get color at this position
        var color = getColorByCount(count, maxCount);
        
        // Create tooltip content
        var content = `<div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 12px; height: 12px; background: ${color}; border: 1px solid white; border-radius: 2px;"></div>
            <div>
                <strong>${formatNumber(count)} athlete${count !== 1 ? 's' : ''}</strong><br>
                <small style="color: #ccc;">Log position: ${relativeX.toFixed(2)}</small>
            </div>
        </div>`;
        
        // Position and show tooltip with transition
        tooltip.html(content)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 40) + "px")
            .style("display", "block")
            .classed("visible", true);
    }
    
    function hideGradientTooltip() {
        var tooltip = d3.select("#gradient-tooltip");
        tooltip.classed("visible", false);
        
        // Hide after transition
        setTimeout(function() {
            if (!tooltip.classed("visible")) {
                tooltip.style("display", "none");
            }
        }, 200);
    }
    
    // Helper function to format numbers with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // Function to update legend with current max count
    function updateLegend(maxCount) {
        var legend = d3.select("#geographic-container .map-legend");
        if (legend.empty()) return;
        
        // Remove old log markers and labels
        legend.selectAll(".log-marker").remove();
        legend.selectAll(".marker-label").remove();
        legend.selectAll(".log-scale-explanation").remove();
        
        // Get SVG and gradient bar dimensions
        var svg = legend.select("svg.gradient-legend");
        if (svg.empty()) return;
        
        var barX = 20;
        var barWidth = 180;
        
        // Calculate log boundaries
        var boundaries = getLogBoundaries(maxCount);
        
        // Add markers and labels for each boundary
        boundaries.forEach(function(boundary) {
            var xPos = barX + (boundary.position * barWidth);
            
            // Add marker line
            svg.append("line")
                .attr("class", "log-marker")
                .attr("x1", xPos)
                .attr("y1", 10) // barY
                .attr("x2", xPos)
                .attr("y2", 35) // below bar
                .attr("stroke", "#666")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2,2");
            
            // Add label
            svg.append("text")
                .attr("class", "marker-label")
                .attr("x", xPos)
                .attr("y", 45)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("fill", "#333")
                .text(boundary.label);
        });
        
        // Add logarithmic scale explanation
        legend.append("div")
            .attr("class", "log-scale-explanation")
            .style("margin-top", "5px")
            .style("font-size", "9px")
            .style("color", "#666")
            .style("line-height", "1.3")
            .html("Logarithmic scale: Each 10× increase = one step in color<br>Helps visualize wide ranges (1 to " + formatNumber(maxCount) + " athletes)");
        
        console.log('Legend updated with maxCount:', maxCount, 'boundaries:', boundaries.length);
    }
    
    // Helper function to calculate log boundaries
    function getLogBoundaries(maxCount) {
        var boundaries = [];
        
        // Always include 1
        boundaries.push({
            value: 1,
            position: 0,
            label: "1"
        });
        
        // Add powers of 10 up to maxCount
        var power = 1;
        while (true) {
            var value = Math.pow(10, power);
            if (value > maxCount) break;
            
            var position = Math.log10(value) / Math.log10(maxCount);
            boundaries.push({
                value: value,
                position: position,
                label: formatNumber(value)
            });
            power++;
        }
        
        // Add maxCount if it's not a power of 10
        var lastBoundary = boundaries[boundaries.length - 1];
        if (lastBoundary.value < maxCount) {
            boundaries.push({
                value: maxCount,
                position: 1,
                label: formatNumber(maxCount)
            });
        }
        
        return boundaries;
    }
    
    // Function to FORCE Finland to be visible
    function forceFinlandVisible() {
        console.log('=== FORCING FINLAND VISIBLE ===');
        
        if (!countriesGroup) {
            console.log('Map not initialized');
            return;
        }
        
        // Find Finland
        const finland = countriesGroup.selectAll("path.country").filter(function(d) {
            const isoCode = d.id ? d.id.toString() : null;
            return isoCode === '246' || getNOCByISO(isoCode) === 'FIN';
        });
        
        console.log('Finland paths found:', finland.size());
        
        if (finland.size() === 0) {
            console.log('ERROR: No Finland found');
            return;
        }
        
        // REMOVE ALL STYLES AND SET TO BRIGHT RED
        finland.each(function() {
            const el = d3.select(this);
            
            // Remove all inline styles
            el.attr('style', null);
            
            // Set explicit, forced styles
            el.attr('fill', '#ff0000')
              .style('fill', '#ff0000')
              .style('fill-opacity', '1')
              .style('opacity', '1')
              .attr('fill-opacity', '1')
              .attr('stroke', '#000000')
              .attr('stroke-width', '2');
              
            // Also set on the DOM element directly
            this.style.fill = '#ff0000';
            this.style.fillOpacity = '1';
            this.style.opacity = '1';
        });
        
        console.log('Finland FORCED to bright red');
        
        // Zoom to Finland
        try {
            const finlandFeature = finland.data()[0];
            const bounds = path.bounds(finlandFeature);
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            const x = (bounds[0][0] + bounds[1][0]) / 2;
            const y = (bounds[0][1] + bounds[1][1]) / 2;
            const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
            
            svg.transition()
                .duration(1000)
                .call(zoom.transform, d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(scale)
                    .translate(-x, -y));
                    
            console.log('Zoomed to Finland');
        } catch (e) {
            console.log('Could not zoom:', e.message);
        }
    }
    
    // Function to highlight Finland for debugging
    function highlightFinland() {
        if (!countriesGroup) {
            console.log('Map not initialized');
            return;
        }
        
        console.log('=== HIGHLIGHTING FINLAND ===');
        
        // Find Finland path
        const finlandPaths = countriesGroup.selectAll("path.country").filter(function(d) {
            const isoCode = d.id ? d.id.toString() : null;
            return isoCode === '246' || getNOCByISO(isoCode) === 'FIN';
        });
        
        console.log('Finland paths found:', finlandPaths.size());
        
        if (finlandPaths.size() === 0) {
            console.log('ERROR: No Finland paths found!');
            console.log('Total paths:', countriesGroup.selectAll("path.country").size());
            
            // List all paths to debug
            countriesGroup.selectAll("path.country").each(function(d, i) {
                if (i < 10) {
                    const isoCode = d.id ? d.id.toString() : null;
                    const name = d.properties?.name || 'Unknown';
                    console.log(`Path ${i}: ${name} (ISO: ${isoCode})`);
                }
            });
            return;
        }
        
        // Debug: Check current attributes
        finlandPaths.each(function() {
            const element = d3.select(this);
            console.log('Finland current attributes:');
            console.log('  - fill:', element.attr('fill'));
            console.log('  - fill-opacity:', element.attr('fill-opacity'));
            console.log('  - opacity:', element.attr('opacity'));
            console.log('  - stroke:', element.attr('stroke'));
            console.log('  - stroke-width:', element.attr('stroke-width'));
            console.log('  - style:', element.attr('style'));
            console.log('  - class:', element.attr('class'));
            
            // Check computed style
            const domElement = this;
            const computed = window.getComputedStyle(domElement);
            console.log('  - computed fill:', computed.fill);
            console.log('  - computed fill-opacity:', computed.fillOpacity);
            console.log('  - computed opacity:', computed.opacity);
        });
        
        // Highlight Finland with bright red border
        finlandPaths
            .attr('stroke', '#ff0000')
            .attr('stroke-width', 3)
            .attr('fill', '#ff9999'); // Pink fill
        
        console.log('Finland highlighted in red/pink');
        
        // Check if color changed
        setTimeout(() => {
            finlandPaths.each(function() {
                const element = d3.select(this);
                console.log('After highlight - fill:', element.attr('fill'));
            });
        }, 100);
        
        // Try to zoom to Finland
        try {
            const finlandFeature = finlandPaths.data()[0];
            const bounds = path.bounds(finlandFeature);
            console.log('Finland bounds:', bounds);
            
            // Calculate zoom to fit Finland
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            const x = (bounds[0][0] + bounds[1][0]) / 2;
            const y = (bounds[0][1] + bounds[1][1]) / 2;
            const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
            
            console.log('Finland center:', x, y);
            console.log('Finland size:', dx, dy);
            console.log('Suggested scale:', scale);
            
            // Zoom to Finland
            svg.transition()
                .duration(1000)
                .call(zoom.transform, d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(scale)
                    .translate(-x, -y));
                    
            console.log('Zoomed to Finland');
        } catch (e) {
            console.log('Could not zoom to Finland:', e.message);
        }
    }
    
    // Debug function to test choropleth
    function debugChoropleth() {
        console.log('=== DEBUG CHOROPLETH ===');
        console.log('1. Checking Finland mapping:');
        console.log('   - getNOCByISO("246") =', getNOCByISO('246'));
        console.log('   - getNOCByISO(246) =', getNOCByISO(246));
        
        console.log('2. Checking countryData:');
        console.log('   - countryData["FIN"] =', countryData['FIN']);
        console.log('   - All countryData keys:', Object.keys(countryData).length);
        
        console.log('3. Checking countryFeatures:');
        console.log('   - Total features:', Object.keys(countryFeatures).length);
        
        // Check if Finland is in countryFeatures
        let finlandFound = false;
        Object.keys(countryFeatures).forEach(key => {
            if (key == 246 || key === '246') {
                finlandFound = true;
                console.log('   - Finland found with key:', key, 'type:', typeof key);
            }
        });
        if (!finlandFound) {
            console.log('   - Finland NOT found in countryFeatures');
            console.log('   - Sample keys:', Object.keys(countryFeatures).slice(0, 10));
        }
        
        console.log('4. Checking map elements:');
        if (countriesGroup) {
            const finlandPaths = countriesGroup.selectAll("path.country").filter(function(d) {
                const isoCode = d.id ? d.id.toString() : null;
                return isoCode === '246' || getNOCByISO(isoCode) === 'FIN';
            });
            console.log('   - Finland paths found:', finlandPaths.size());
            if (finlandPaths.size() > 0) {
                const color = finlandPaths.attr('fill');
                console.log('   - Finland current color:', color);
                console.log('   - Expected color for 9 athletes:', getColorByCount(9));
                
                // Test setting color directly
                console.log('   - Testing direct color set...');
                finlandPaths.attr('fill', '#00ff00'); // Bright green
                setTimeout(() => {
                    const newColor = finlandPaths.attr('fill');
                    console.log('   - After setting green:', newColor);
                    
                    // Set back to choropleth color
                    finlandPaths.attr('fill', '#fe9929');
                    setTimeout(() => {
                        console.log('   - After setting orange:', finlandPaths.attr('fill'));
                    }, 100);
                }, 100);
            }
        }
        
        console.log('=== END DEBUG ===');
    }
    
    // Public API
    return {
        init: init,
        updateMap: updateMap,
        handleResize: handleResize,
        getNOCByISO: getNOCByISO,
        getCountryNameByNOC: getCountryNameByNOC,
        // debugChoropleth: debugChoropleth, // Debug function - commented out for production
        // highlightFinland: highlightFinland, // Debug function - commented out for production
        // forceFinlandVisible: forceFinlandVisible, // Debug function - commented out for production
        updateLegend: updateLegend,
        initialized: false
    };
})();