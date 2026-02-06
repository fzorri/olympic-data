document.addEventListener('DOMContentLoaded', function() {
    // Configuration Constants
    const SCALE_FACTOR = 5;
    const MIN_HEIGHT = 137;
    const BASE_BOTTOM = 45;
    const MIN_WEIGHT = 28;
    const BASE_LEFT = 20;
    
    // SVG Dimensions (Coordinate System)
    const SVG_WIDTH = 740;
    const SVG_HEIGHT = 480;

    var graphSvg = document.getElementById('graph-svg');
    var plotArea = document.getElementById('plot-area');
    var bmiLayer = document.getElementById('bmi-layer');
    var gridLayer = document.getElementById('grid-layer');
    var dotsLayer = document.getElementById('dots-layer');
    var tooltip = document.getElementById('graph-tooltip');
    
    var resultPanel = document.getElementById('olympian_detail');
    var statusText = document.getElementById('status');
    var percentileFeedback = document.getElementById('percentile-feedback');
    var listPanel = document.getElementById('olympian_list');

    // Dashboard Elements
    var dashCount = document.getElementById('dash-count');
    var dashHeight = document.getElementById('dash-height');
    var dashWeight = document.getElementById('dash-weight');
    var dashCountry = document.getElementById('dash-country');

    // Filter Elements
    var filterField = document.getElementById('filter-field');
    var filterOperator = document.getElementById('filter-operator');
    var filterValueContainer = document.getElementById('filter-value-container');
    var addFilterBtn = document.getElementById('add-filter-btn');
    var activeFiltersContainer = document.getElementById('active-filters');

    var activeFilters = [];
    var currentFilteredIndices = []; 

    // Zoom/Pan State
    var transform = { k: 1, x: 0, y: 0 };
    var isDragging = false;
    var startDrag = { x: 0, y: 0 };

    // --- Initialization ---
    
    drawBMIZones();
    drawGrid();
    resetFilters(); 
    updateFilterUI(); 
    initZoomPan();

    // --- Event Listeners ---

    filterField.addEventListener('change', updateFilterUI);
    addFilterBtn.addEventListener('click', addFilter);

    document.getElementById('compareBtn').addEventListener('click', function() {
        var h = document.getElementById('height').value;
        var w = document.getElementById('weight').value;
        if (h && w) {
            searchAthlete(h, w);
        }
    });

    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('olympian_detail').style.display = 'none';
    });

    // Dismiss tooltip on click outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#graph-svg') && !e.target.closest('#compareBtn')) {
             deselectAll();
        }
    });
    
    var tooltipTimeout;
    function deselectAll() {
        var selected = plotArea.querySelector('.selected');
        if(selected) selected.classList.remove('selected');
        tooltip.style.display = 'none';
        if (tooltipTimeout) clearTimeout(tooltipTimeout);
    }

    // --- Grid & BMI Logic ---
    function drawGrid() {
        var svgNS = "http://www.w3.org/2000/svg";
        
        // Height Lines (Horizontal)
        for (var h = 130; h <= 230; h += 10) {
            var bottom = (h - MIN_HEIGHT) * SCALE_FACTOR + BASE_BOTTOM;
            var y = SVG_HEIGHT - bottom;
            
            // Line
            var line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', SVG_WIDTH);
            line.setAttribute('y2', y);
            line.setAttribute('class', 'grid-line');
            gridLayer.appendChild(line);
            
            // Label
            var text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', 5);
            text.setAttribute('y', y - 2);
            text.setAttribute('class', 'grid-label');
            text.textContent = h + ' cm';
            gridLayer.appendChild(text);
        }
        
        // Weight Lines (Vertical)
        for (var w = 30; w <= 180; w += 10) {
            var left = (w - MIN_WEIGHT) * SCALE_FACTOR + BASE_LEFT;
            var x = left;
            
            // Line
            var line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', SVG_HEIGHT);
            line.setAttribute('class', 'grid-line');
            gridLayer.appendChild(line);
            
            // Label
            var text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', x + 2);
            text.setAttribute('y', SVG_HEIGHT - 5);
            text.setAttribute('class', 'grid-label');
            text.textContent = w + ' kg';
            gridLayer.appendChild(text);
        }
    }

    function drawBMIZones() {
        var svgNS = "http://www.w3.org/2000/svg";
        var bmis = [
            { val: 18.5, color: "#88cc88", label: "Bajo Peso" },
            { val: 25,   color: "#8888cc", label: "Normal" },
            { val: 30,   color: "#cc8888", label: "Sobrepeso" },
            { val: 40,   color: "#cc4444", label: "Obesidad" } // Cap at reasonable value
        ];

        // Draw curves
        bmis.forEach(bmi => {
            var pathData = [];
            for (var h = 130; h <= 230; h += 2) {
                // w = bmi * (h/100)^2
                var w = bmi.val * Math.pow(h / 100, 2);
                
                // Convert to coords
                var bottom = (h - MIN_HEIGHT) * SCALE_FACTOR + BASE_BOTTOM;
                var y = SVG_HEIGHT - bottom;
                var left = (w - MIN_WEIGHT) * SCALE_FACTOR + BASE_LEFT;
                var x = left;
                
                if (x >= -50 && x <= SVG_WIDTH + 50 && y >= -50 && y <= SVG_HEIGHT + 50) {
                    pathData.push((pathData.length === 0 ? "M" : "L") + x + "," + y);
                }
            }
            
            if (pathData.length > 1) {
                var path = document.createElementNS(svgNS, 'path');
                path.setAttribute('d', pathData.join(" "));
                path.setAttribute('class', 'bmi-path');
                path.style.stroke = bmi.color;
                bmiLayer.appendChild(path);
                
                // Add label at the end of the curve (top right area)
                // Pick a point near h=220 or max visibility
                // Simple label placement logic: find a valid point near the right edge
                var labelH = 220;
                var labelW = bmi.val * Math.pow(labelH/100, 2);
                var ly = SVG_HEIGHT - ((labelH - MIN_HEIGHT) * SCALE_FACTOR + BASE_BOTTOM);
                var lx = (labelW - MIN_WEIGHT) * SCALE_FACTOR + BASE_LEFT;
                
                // Adjust if out of bounds
                if (lx > SVG_WIDTH - 20) {
                     lx = SVG_WIDTH - 20;
                     // Reverse calc h for this w? Simplification: just clamp
                }

                var text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', lx);
                text.setAttribute('y', ly);
                text.setAttribute('class', 'bmi-label');
                text.style.fill = bmi.color;
                text.textContent = bmi.label;
                // bmiLayer.appendChild(text); // Labels can be cluttered, maybe omit for cleanliness or position carefully
            }
        });
        
        // Add zone text labels manually for better placement
        var zones = [
            { text: "Bajo Peso", h: 210, w: 70, color: "#88cc88" },
            { text: "Normal", h: 210, w: 100, color: "#8888cc" },
            { text: "Sobrepeso", h: 200, w: 115, color: "#cc8888" },
            { text: "Obesidad", h: 180, w: 130, color: "#cc4444" }
        ];
        
        zones.forEach(z => {
             var bottom = (z.h - MIN_HEIGHT) * SCALE_FACTOR + BASE_BOTTOM;
             var y = SVG_HEIGHT - bottom;
             var left = (z.w - MIN_WEIGHT) * SCALE_FACTOR + BASE_LEFT;
             var x = left;
             
             var text = document.createElementNS(svgNS, 'text');
             text.setAttribute('x', x);
             text.setAttribute('y', y);
             text.setAttribute('class', 'bmi-label');
             text.style.fill = z.color;
             text.textContent = z.text;
             bmiLayer.appendChild(text);
        });
    }
    
    function updateLabelScale(scale) {
        var labels = document.querySelectorAll('.grid-label');
        var fontSize = 10 / scale;
        labels.forEach(l => {
            l.setAttribute('font-size', fontSize);
        });
        
        // Also scale BMI labels
        var bmiLabels = document.querySelectorAll('.bmi-label');
        var bmiSize = 12 / scale;
        bmiLabels.forEach(l => {
            l.setAttribute('font-size', bmiSize);
        });
    }

    // --- Zoom & Pan Logic ---
    function initZoomPan() {
        updateLabelScale(transform.k); // Initial scale
        
        // Wheel Zoom
        graphSvg.addEventListener('wheel', function(e) {
            e.preventDefault();
            var zoomIntensity = 0.1;
            var wheel = e.deltaY < 0 ? 1 : -1;
            var zoom = Math.exp(wheel * zoomIntensity);
            
            var pt = getEventPoint(e);
            
            var newK = transform.k * zoom;
            newK = Math.max(0.5, Math.min(newK, 10)); 
            
            transform.x = pt.x - (pt.x - transform.x) * (newK / transform.k);
            transform.y = pt.y - (pt.y - transform.y) * (newK / transform.k);
            transform.k = newK;
            
            updateTransform();
            updateLabelScale(newK);
        });

        // Drag Pan
        graphSvg.addEventListener('mousedown', function(e) {
            isDragging = true;
            startDrag = { x: e.clientX, y: e.clientY };
            graphSvg.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            e.preventDefault();
            var dx = e.clientX - startDrag.x;
            var dy = e.clientY - startDrag.y;
            
            transform.x += dx;
            transform.y += dy;
            
            startDrag = { x: e.clientX, y: e.clientY };
            updateTransform();
        });

        window.addEventListener('mouseup', function() {
            isDragging = false;
            graphSvg.style.cursor = 'grab';
        });
    }

    function getEventPoint(e) {
        var rect = graphSvg.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function updateTransform() {
        plotArea.setAttribute('transform', 'translate(' + transform.x + ',' + transform.y + ') scale(' + transform.k + ')');
    }


    // --- Filter Logic --- 

    function updateFilterUI() {
        var field = filterField.value;
        var ops = [];
        var inputHtml = '';

        switch (field) {
            case 'height':
            case 'weight':
            case 'gold':
            case 'silver':
            case 'bronze':
                ops = ['>', '<', '=', '>=', '<='];
                inputHtml = '<input type="number" id="filter-value" value="0">';
                break;
            case 'age':
                ops = ['>', '<', '=', '>=', '<='];
                inputHtml = '<select id="filter-value">';
                ageArray.forEach(age => {
                    inputHtml += '<option value="' + age + '">' + age + '</option>';
                });
                inputHtml += '</select>';
                break;
            case 'year':
                ops = ['>', '<', '=', '>=', '<='];
                inputHtml = '<select id="filter-value">';
                yearArray.forEach(year => {
                    inputHtml += '<option value="' + year + '">' + year + '</option>';
                });
                inputHtml += '</select>';
                break;
            case 'name':
                ops = ['contains'];
                inputHtml = '<input type="text" id="filter-value" placeholder="Nombre">';
                break;
            case 'gender':
                ops = ['is'];
                inputHtml = '<select id="filter-value"><option value="M">Hombre</option><option value="F">Mujer</option></select>';
                break;
            case 'country':
                ops = ['is', 'is not'];
                inputHtml = '<select id="filter-value">';
                // Create sortable array preserving original index
                var sortedCountries = countryArray.map((name, i) => ({ name: name, index: i }));
                sortedCountries.sort((a, b) => a.name.localeCompare(b.name, 'es'));
                
                sortedCountries.forEach(item => {
                    inputHtml += '<option value="' + item.index + '">' + item.name + '</option>';
                });
                inputHtml += '</select>';
                break;
            case 'sport':
                ops = ['is', 'is not'];
                inputHtml = '<select id="filter-value">';
                // Create sortable array preserving original index
                var sortedSports = eventArray.map((name, i) => ({ name: name, index: i }));
                sortedSports.sort((a, b) => a.name.localeCompare(b.name, 'es'));

                sortedSports.forEach(item => {
                    inputHtml += '<option value="' + item.index + '">' + item.name + '</option>';
                });
                inputHtml += '</select>';
                break;
        }

        filterOperator.innerHTML = '';
        ops.forEach(op => {
            var option = document.createElement('option');
            option.value = op;
            option.innerText = (op === 'is not') ? 'no es' : (op === 'is' ? 'es' : op);
            filterOperator.appendChild(option);
        });

        filterValueContainer.innerHTML = inputHtml;
    }

    function addFilter() {
        var field = filterField.value;
        var operator = filterOperator.value;
        var valueEl = document.getElementById('filter-value');
        var value = valueEl.value;
        var displayValue = value; 

        if (valueEl.tagName === 'SELECT') {
            displayValue = valueEl.options[valueEl.selectedIndex].text;
        }
        
        var displayOperator = operator;
        if (operator === 'is') displayOperator = 'es';
        if (operator === 'is not') displayOperator = 'no es';

        var filter = {
            field: field,
            operator: operator,
            value: value,
            displayValue: displayValue,
            displayOperator: displayOperator
        };

        activeFilters.push(filter);
        renderActiveFilters();
        applyFilters();
    }

    function removeFilter(index) {
        activeFilters.splice(index, 1);
        renderActiveFilters();
        applyFilters();
    }

    function renderActiveFilters() {
        activeFiltersContainer.innerHTML = '';
        activeFilters.forEach((f, i) => {
            var tag = document.createElement('div');
            tag.className = 'filter-tag';
            var fieldLabel = filterField.querySelector(`option[value="${f.field}"]`).text;
            tag.innerHTML = `<span>${fieldLabel} ${f.displayOperator || f.operator} ${f.displayValue}</span> <span class="filter-remove" data-index="${i}">x</span>`;
            activeFiltersContainer.appendChild(tag);
        });

        document.querySelectorAll('.filter-remove').forEach(el => {
            el.addEventListener('click', function() {
                removeFilter(parseInt(this.dataset.index));
            });
        });
    }

    function resetFilters() {
        activeFilters = [];
        applyFilters();
    }

    function applyFilters() {
        currentFilteredIndices = [];
        olympianArray.forEach((athlete, index) => {
            var pass = true;
            for (var f of activeFilters) {
                if (!checkCondition(athlete, f)) {
                    pass = false;
                    break;
                }
            }
            if (pass) {
                currentFilteredIndices.push(index);
            }
        });

        renderGraph(currentFilteredIndices);
        updateDashboard(currentFilteredIndices);
        
        listPanel.innerHTML = '';
        document.getElementById('olympian_detail').style.display = 'none';
        statusText.innerHTML = "Mostrando " + currentFilteredIndices.length + " atletas.";
    }

    function updateDashboard(indices) {
        var count = indices.length;
        dashCount.innerText = count;

        if (count === 0) {
            dashHeight.innerText = '0';
            dashWeight.innerText = '0';
            dashCountry.innerText = '-';
            return;
        }

        var totalH = 0;
        var totalW = 0;
        var countryCounts = {};

        indices.forEach(index => {
            var a = olympianArray[index];
            totalH += a[0];
            totalW += a[1];
            
            var cIdx = a[7];
            if (!countryCounts[cIdx]) countryCounts[cIdx] = 0;
            countryCounts[cIdx]++;
        });

        dashHeight.innerText = Math.round(totalH / count);
        dashWeight.innerText = Math.round(totalW / count);

        var maxC = 0;
        var topCIdx = -1;
        for (var cIdx in countryCounts) {
            if (countryCounts[cIdx] > maxC) {
                maxC = countryCounts[cIdx];
                topCIdx = cIdx;
            }
        }

        if (topCIdx !== -1) {
            dashCountry.innerText = countryArray[topCIdx] + ' (' + maxC + ')';
        } else {
            dashCountry.innerText = '-';
        }
    }

    function checkCondition(athlete, filter) {
        var val;
        switch (filter.field) {
            case 'height': val = athlete[0]; break;
            case 'weight': val = athlete[1]; break;
            case 'name': val = (athlete[3][0] + ' ' + athlete[3][1]).toLowerCase(); break;
            case 'gold': val = athlete[4]; break;
            case 'silver': val = athlete[5]; break;
            case 'bronze': val = athlete[6]; break;
            case 'country': val = athlete[7]; break; 
            case 'sport': val = athlete[8]; break; 
            case 'age': val = athlete[12]; break;
            case 'year': val = athlete[13]; break;
            case 'gender': val = athlete[10]; break;
        }

        var target = filter.value;
        if (filter.field === 'name') {
            return val.includes(target.toLowerCase());
        }
        if (['height', 'weight', 'gold', 'silver', 'bronze', 'country', 'sport', 'age', 'year'].includes(filter.field)) {
            val = parseFloat(val);
            target = parseFloat(target);
        }

        switch (filter.operator) {
            case '>': return val > target;
            case '<': return val < target;
            case '=': return val == target; 
            case '>=': return val >= target;
            case '<=': return val <= target;
            case 'is': return val == target; 
            case 'is not': return val != target;
            default: return false;
        }
    }

    // --- Graph Rendering (SVG) ---

    function renderGraph(indices) {
        var groupedData = {};
        
        indices.forEach(function(index) {
            var athlete = olympianArray[index];
            var h = athlete[0];
            var w = athlete[1];
            var key = h + '_' + w;
            
            if (!groupedData[key]) {
                groupedData[key] = {
                    h: h,
                    w: w,
                    count: 0,
                    athletes: [] 
                };
            }
            groupedData[key].count++;
            groupedData[key].athletes.push(index);
        });

        var svgNS = "http://www.w3.org/2000/svg";
        
        // Clear children from DOTS layer only
        while (dotsLayer.firstChild) {
            dotsLayer.removeChild(dotsLayer.firstChild);
        }

        for (var key in groupedData) {
            var group = groupedData[key];
            var h = group.h;
            var w = group.w;
            var count = group.count;
            
            // Calculate Coordinates
            var bottom = (h - MIN_HEIGHT) * SCALE_FACTOR + BASE_BOTTOM;
            var cy = SVG_HEIGHT - bottom;
            
            var left = (w - MIN_WEIGHT) * SCALE_FACTOR + BASE_LEFT;
            var cx = left;
            
            var circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', cx);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', 4); // Base radius
            
            var densityClass = 'o' + (count > 12 ? 12 : count);
            var hwClass = 'hw' + h + '_' + w;
            
            // Store data for tooltip
            circle.dataset.tooltip = h + ' cm, ' + w + ' kg';
            circle.setAttribute('class', densityClass + ' ' + hwClass); 

            // Events
            circle.addEventListener('mouseenter', function(e) {
                if (!this.classList.contains('selected')) {
                    showTooltip(this, e);
                }
            });
            
            circle.addEventListener('mouseleave', function() {
                if (!this.classList.contains('selected')) {
                    hideTooltip();
                }
            });
            
            circle.addEventListener('click', function(e) {
                e.stopPropagation(); 
                if (this.classList.contains('selected')) {
                     deselectAll();
                     return;
                }
                deselectAll(); 
                
                this.classList.add('selected');
                showTooltip(this, e);
                
                if(tooltipTimeout) clearTimeout(tooltipTimeout);
                tooltipTimeout = setTimeout(function(){
                    if(tooltip.style.display === 'block') hideTooltip();
                }, 5000);
                
                var classes = this.getAttribute('class').split(' ');
                var hwClass = classes.find(c => c.startsWith('hw'));
                if (hwClass) showOlympians(hwClass);
            });

            dotsLayer.appendChild(circle);
        }
    }
    
    function showTooltip(el, e) {
        var text = el.dataset.tooltip;
        if(text) {
            var parts = text.split(',');
            if (parts.length >= 2) {
                 tooltip.innerHTML = parts[0] + '<br>' + parts[1];
            } else {
                 tooltip.innerHTML = text;
            }
        }
        
        tooltip.style.display = 'block';
        
        // Position tooltip
        var rect = el.getBoundingClientRect();
        // Center above
        var top = rect.top;
        var left = rect.left + rect.width/2;
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }
    
    function hideTooltip() {
        tooltip.style.display = 'none';
    }

    function searchAthlete(h, w) {
        h = parseInt(h);
        w = parseInt(w);
        
        calculatePercentiles(h, w);
        
        var className = 'hw' + h + '_' + w;
        var el = dotsLayer.querySelector('.' + className); // Scope to dots layer
        
        if (el) {
            var event = new Event('click', { bubbles: true });
            el.dispatchEvent(event);
            statusText.innerHTML = returnExact.replace('{H}', h).replace('{W}', w);
            return;
        }

        // Closest match logic
        var range = 10;
        for (var d = 1; d <= range; d++) {
            for (var dh = -d; dh <= d; dh++) {
                for (var dw = -d; dw <= d; dw++) {
                    if (Math.abs(dh) !== d && Math.abs(dw) !== d) continue; 
                    
                    var checkH = h + dh;
                    var checkW = w + dw;
                    var checkClass = 'hw' + checkH + '_' + checkW;
                    var checkEl = dotsLayer.querySelector('.' + checkClass);
                    
                    if (checkEl) {
                        var event = new Event('click', { bubbles: true });
                        checkEl.dispatchEvent(event);
                        var text = returnClosest.replace('{H}', checkH).replace('{W}', checkW);
                        statusText.innerHTML = "No se encontró exacto. " + text;
                        return;
                    }
                }
            }
        }
        statusText.innerHTML = "No se encontraron atletas visibles cercanos a " + h + "cm, " + w + "kg.";
    }

    function showOlympians(hwClass) {
        var parts = hwClass.substring(2).split('_');
        var h = parseInt(parts[0]);
        var w = parseInt(parts[1]);
        
        var matches = [];
        currentFilteredIndices.forEach(function(index) {
            var athlete = olympianArray[index];
            if (athlete[0] == h && athlete[1] == w) {
                matches.push(index);
            }
        });

        var html = '';
        matches.forEach(function(index) {
            var o = olympianArray[index];
            var name = o[3][0] + ' ' + o[3][1];
            var countryIdx = o[7];
            var country = countryArray[countryIdx];
            var sportIdx = o[8];
            var sport = eventArray[sportIdx];
            
            html += '<li class="olym" onclick="showDetail(' + index + ')">';
            html += '<strong>' + name + '</strong> - ' + country + ' (' + sport + ')';
            html += '</li>';
        });
        
        listPanel.innerHTML = html;
        if (matches.length > 0) showDetail(matches[0]);
    }

    window.showDetail = function(index) {
        var o = olympianArray[index];
        var detail = document.getElementById('olympian_detail_inner');
        
        detail.querySelector('h2').innerText = o[3][0] + ' ' + o[3][1];
        detail.querySelector('h3').innerText = countryArray[o[7]];
        
        detail.querySelector('.height').innerHTML = '<span>' + termHeight + ':</span> ' + o[0] + ' cm';
        detail.querySelector('.weight').innerHTML = '<span>' + termWeight + ':</span> ' + o[1] + ' kg';
        detail.querySelector('.gender').innerHTML = '<span>' + term_gender + ':</span> ' + (o[10] == 'M' ? term_male : term_female);
        detail.querySelector('.sport').innerHTML = '<span>' + term_sport + ':</span> ' + eventArray[o[8]];
        
        var medalHtml = '';
        o[11].forEach(function(m) {
            medalHtml += '<li class="' + m[1] + '">' + m[0] + '</li>';
        });
        document.getElementById('olympian_medals').innerHTML = medalHtml;
        document.getElementById('olympian_detail').style.display = 'block';
    }

    function calculatePercentiles(h, w) {
        if (currentFilteredIndices.length === 0) {
            percentileFeedback.style.display = 'none';
            return;
        }

        var total = currentFilteredIndices.length;
        var shorterCount = 0;
        var lighterCount = 0;
        
        // Sport aggregation for closest profile
        var sportStats = {}; // sportIndex -> {hSum, wSum, count}

        currentFilteredIndices.forEach(function(index) {
            var a = olympianArray[index];
            if (a[0] < h) shorterCount++;
            if (a[1] < w) lighterCount++;
            
            // Sport stats
            var sIdx = a[8];
            if (!sportStats[sIdx]) sportStats[sIdx] = { hSum: 0, wSum: 0, count: 0 };
            sportStats[sIdx].hSum += a[0];
            sportStats[sIdx].wSum += a[1];
            sportStats[sIdx].count++;
        });

        var heightPercentile = Math.round((shorterCount / total) * 100);
        var weightPercentile = Math.round((lighterCount / total) * 100);

        // Find closest sport
        var minDist = Infinity;
        var closestSportName = '';

        for (var sIdx in sportStats) {
            var stats = sportStats[sIdx];
            var avgH = stats.hSum / stats.count;
            var avgW = stats.wSum / stats.count;
            
            // Euclidean distance (simple)
            var dist = Math.sqrt(Math.pow(avgH - h, 2) + Math.pow(avgW - w, 2));
            
            if (dist < minDist) {
                minDist = dist;
                closestSportName = eventArray[sIdx]; // eventArray is flat array
            }
        }

        var feedbackHTML = '<strong>Tu comparación con los ' + total + ' atletas visibles:</strong><br>' +
            'Eres más alto que el <strong>' + heightPercentile + '%</strong>.<br>' +
            'Pesas más que el <strong>' + weightPercentile + '%</strong>.<br>';
        
        if (closestSportName) {
            feedbackHTML += 'Tu complexión es similar al promedio de: <strong>' + closestSportName + '</strong>.';
        }

        percentileFeedback.innerHTML = feedbackHTML;
        percentileFeedback.style.display = 'block';
    }
});