window.App = window.App || {};

App.Graph = (function() {
    var graphSvg, plotArea, bmiLayer, gridLayer, dotsLayer, tooltip;
    var SVG_WIDTH, SVG_HEIGHT, SCALE_FACTOR, MIN_HEIGHT, BASE_BOTTOM, MIN_WEIGHT, BASE_LEFT;

    function init() {
        // Load constants
        SVG_WIDTH = App.Config.SVG_WIDTH;
        SVG_HEIGHT = App.Config.SVG_HEIGHT;
        SCALE_FACTOR = App.Config.SCALE_FACTOR;
        MIN_HEIGHT = App.Config.MIN_HEIGHT;
        BASE_BOTTOM = App.Config.BASE_BOTTOM;
        MIN_WEIGHT = App.Config.MIN_WEIGHT;
        BASE_LEFT = App.Config.BASE_LEFT;

        // Cache DOM elements
        graphSvg = document.getElementById('graph-svg');
        plotArea = document.getElementById('plot-area');
        bmiLayer = document.getElementById('bmi-layer');
        gridLayer = document.getElementById('grid-layer');
        dotsLayer = document.getElementById('dots-layer');
        tooltip = document.getElementById('graph-tooltip');

        drawGrid();
        drawBMIZones();
        initZoomPan();
        
        // Dismiss tooltip on click outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#graph-svg') && !e.target.closest('#compareBtn')) {
                 deselectAll();
            }
        });
    }

    function drawGrid() {
        var svgNS = "http://www.w3.org/2000/svg";
        
        // Height Lines (Horizontal)
        for (var h = 130; h <= 230; h += 10) {
            var bottom = (h - MIN_HEIGHT) * SCALE_FACTOR + BASE_BOTTOM;
            var y = SVG_HEIGHT - bottom;
            
            var line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', SVG_WIDTH);
            line.setAttribute('y2', y);
            line.setAttribute('class', 'grid-line');
            gridLayer.appendChild(line);
            
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
            
            var line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', SVG_HEIGHT);
            line.setAttribute('class', 'grid-line');
            gridLayer.appendChild(line);
            
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
            { val: 40,   color: "#cc4444", label: "Obesidad" }
        ];

        bmis.forEach(bmi => {
            var pathData = [];
            for (var h = 130; h <= 230; h += 2) {
                var w = bmi.val * Math.pow(h / 100, 2);
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
            }
        });
        
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

    function render(indices) {
        var groupedData = {};
        
        indices.forEach(function(index) {
            var athlete = olympianArray[index];
            var h = athlete[0];
            var w = athlete[1];
            
            if (h === null || w === null || isNaN(h) || isNaN(w)) {
                return;
            }

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
        while (dotsLayer.firstChild) {
            dotsLayer.removeChild(dotsLayer.firstChild);
        }

        for (var key in groupedData) {
            var group = groupedData[key];
            var h = group.h;
            var w = group.w;
            var count = group.count;
            
            var bottom = (h - MIN_HEIGHT) * SCALE_FACTOR + BASE_BOTTOM;
            var cy = SVG_HEIGHT - bottom;
            var left = (w - MIN_WEIGHT) * SCALE_FACTOR + BASE_LEFT;
            var cx = left;
            
            var circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', cx);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', 4);
            
            var densityClass = 'o' + (count > 12 ? 12 : count);
            var hwClass = 'hw' + h + '_' + w;
            
            circle.dataset.tooltip = h + ' cm, ' + w + ' kg';
            circle.setAttribute('class', densityClass + ' ' + hwClass); 

            circle.addEventListener('mouseenter', function(e) {
                if (!this.classList.contains('selected')) {
                    App.UI.showTooltip(this, e); // Call UI module
                }
            });
            
            circle.addEventListener('mouseleave', function() {
                if (!this.classList.contains('selected')) {
                    App.UI.hideTooltip();
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
                App.UI.showTooltip(this, e);
                
                if(App.State.tooltipTimeout) clearTimeout(App.State.tooltipTimeout);
                App.State.tooltipTimeout = setTimeout(function(){
                    App.UI.hideTooltip(); // Simplified, might need check if visible
                }, 5000);
                
                var classes = this.getAttribute('class').split(' ');
                var hwClass = classes.find(c => c.startsWith('hw'));
                if (hwClass) App.UI.showOlympians(hwClass); // Call UI module
            });

            dotsLayer.appendChild(circle);
        }
    }

    function deselectAll() {
        var selected = plotArea.querySelector('.selected');
        if(selected) selected.classList.remove('selected');
        if(App.UI.hideTooltip) App.UI.hideTooltip();
        if (App.State.tooltipTimeout) clearTimeout(App.State.tooltipTimeout);
    }

    function initZoomPan() {
        updateLabelScale(App.State.transform.k);
        
        graphSvg.addEventListener('wheel', function(e) {
            e.preventDefault();
            var zoomIntensity = 0.1;
            var wheel = e.deltaY < 0 ? 1 : -1;
            var zoom = Math.exp(wheel * zoomIntensity);
            
            var pt = getEventPoint(e);
            
            var newK = App.State.transform.k * zoom;
            newK = Math.max(0.5, Math.min(newK, 10)); 
            
            App.State.transform.x = pt.x - (pt.x - App.State.transform.x) * (newK / App.State.transform.k);
            App.State.transform.y = pt.y - (pt.y - App.State.transform.y) * (newK / App.State.transform.k);
            App.State.transform.k = newK;
            
            updateTransform();
            updateLabelScale(newK);
        });

        graphSvg.addEventListener('mousedown', function(e) {
            App.State.isDragging = true;
            App.State.startDrag = { x: e.clientX, y: e.clientY };
            graphSvg.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', function(e) {
            if (!App.State.isDragging) return;
            e.preventDefault();
            var dx = e.clientX - App.State.startDrag.x;
            var dy = e.clientY - App.State.startDrag.y;
            
            App.State.transform.x += dx;
            App.State.transform.y += dy;
            
            App.State.startDrag = { x: e.clientX, y: e.clientY };
            updateTransform();
        });

        window.addEventListener('mouseup', function() {
            App.State.isDragging = false;
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
        plotArea.setAttribute('transform', 'translate(' + App.State.transform.x + ',' + App.State.transform.y + ') scale(' + App.State.transform.k + ')');
    }

    function updateLabelScale(scale) {
        var labels = document.querySelectorAll('.grid-label');
        var fontSize = 10 / scale;
        labels.forEach(l => {
            l.setAttribute('font-size', fontSize);
        });
        
        var bmiLabels = document.querySelectorAll('.bmi-label');
        var bmiSize = 12 / scale;
        bmiLabels.forEach(l => {
            l.setAttribute('font-size', bmiSize);
        });
    }

    return {
        init: init,
        render: render,
        deselectAll: deselectAll,
        getDotsLayer: function() { return dotsLayer; } // Expose for search
    };
})();
