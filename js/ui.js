window.App = window.App || {};

App.UI = (function() {
    var dashCount, dashHeight, dashWeight, dashCountry, dashMedals, dashHiddenContainer, dashHidden, viewHiddenBtn;
    var listPanel, detailPanel, statusText, percentileFeedback, tooltip;
    var termHeight, termWeight, term_gender, term_sport, term_male, term_female;

    function init() {
        // Dashboard Elements
        dashCount = document.getElementById('dash-count');
        dashHeight = document.getElementById('dash-height');
        dashWeight = document.getElementById('dash-weight');
        dashCountry = document.getElementById('dash-country');
        dashMedals = document.getElementById('dash-medals');
        dashHiddenContainer = document.getElementById('dash-hidden-container');
        dashHidden = document.getElementById('dash-hidden');
        viewHiddenBtn = document.getElementById('view-hidden-btn');

        // Panels
        listPanel = document.getElementById('olympian_list');
        detailPanel = document.getElementById('olympian_detail');
        statusText = document.getElementById('status');
        percentileFeedback = document.getElementById('percentile-feedback');
        tooltip = document.getElementById('graph-tooltip');

        // Close Detail
        document.querySelector('.close').addEventListener('click', function() {
            detailPanel.style.display = 'none';
        });

        // View Hidden
        viewHiddenBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showHiddenAthletes();
        });

        // Load Terms (Assuming they are global from data.js)
        // If not, we should have them in config or passed in. 
        // Currently data.js is loaded first, so they are global.
        termHeight = window.termHeight;
        termWeight = window.termWeight;
        term_gender = window.term_gender;
        term_sport = window.term_sport;
        term_male = window.term_male;
        term_female = window.term_female;
    }

    function updateDashboard(indices) {
        var count = indices.length;
        dashCount.innerText = count;

        if (count === 0) {
            dashHeight.innerText = '0';
            dashWeight.innerText = '0';
            dashCountry.innerText = '-';
            dashMedals.innerText = '0';
            return;
        }

        var totalH = 0;
        var totalW = 0;
        var validHCount = 0;
        var validWCount = 0;
        var totalMedals = 0;
        var countryCounts = {};

        indices.forEach(index => {
            var a = olympianArray[index];
            if (a[0] !== null && !isNaN(a[0])) {
                totalH += a[0];
                validHCount++;
            }
            
            if (a[1] !== null && !isNaN(a[1])) {
                totalW += a[1];
                validWCount++;
            }
            
            totalMedals += (a[4] || 0) + (a[5] || 0) + (a[6] || 0);
            
            var cIdx = a[7];
            if (!countryCounts[cIdx]) countryCounts[cIdx] = 0;
            countryCounts[cIdx]++;
        });

        dashHeight.innerText = validHCount > 0 ? Math.round(totalH / validHCount) : '0';
        dashWeight.innerText = validWCount > 0 ? Math.round(totalW / validWCount) : '0';
        dashMedals.innerText = totalMedals;

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

    function updateHiddenCount(count) {
        if (count > 0) {
            dashHiddenContainer.style.display = 'inline-block';
            dashHidden.innerText = count;
        } else {
            dashHiddenContainer.style.display = 'none';
        }
    }

    function updateStatus(text) {
        statusText.innerHTML = text;
    }

    function hideDetail() {
        detailPanel.style.display = 'none';
    }

    function clearList() {
        listPanel.innerHTML = '';
    }

    function showHiddenAthletes() {
        renderList(App.State.hiddenIndices, "Atletas con datos incompletos (sin estatura o peso):");
    }

    function renderList(indices, title) {
        var html = '';
        if (title) html += '<h3>' + title + '</h3>';
        
        indices.forEach(function(index) {
            var o = olympianArray[index];
            var name = o[3][0] + ' ' + o[3][1];
            var countryIdx = o[7];
            var country = countryArray[countryIdx];
            var sportIdx = o[8];
            var sport = eventArray[sportIdx];
            
            html += '<li class="olym" onclick="App.UI.showDetail(' + index + ')">';
            html += '<strong>' + name + '</strong> - ' + country + ' (' + sport + ')';
            html += '</li>';
        });
        
        listPanel.innerHTML = html;
    }

    function showOlympians(hwClass) {
        var parts = hwClass.substring(2).split('_');
        var h = parseInt(parts[0]);
        var w = parseInt(parts[1]);
        
        var matches = [];
        App.State.currentFilteredIndices.forEach(function(index) {
            var athlete = olympianArray[index];
            if (athlete[0] == h && athlete[1] == w) {
                matches.push(index);
            }
        });

        renderList(matches);
        if (matches.length > 0) showDetail(matches[0]);
    }

    function showDetail(index) {
        var o = olympianArray[index];
        var detail = document.getElementById('olympian_detail_inner');
        
        detail.querySelector('h2').innerText = o[3][0] + ' ' + o[3][1];
        detail.querySelector('h3').innerText = countryArray[o[7]];
        
        var ages = o[12];
        var ageText = (ages && ages.length > 0) ? ages.join(', ') : 'N/A';
        if (ages && ages.length > 1) {
             ageText = ages.join(', ');
        }

        detail.querySelector('.height').innerHTML = '<span>' + termHeight + ':</span> ' + o[0] + ' cm';
        detail.querySelector('.weight').innerHTML = '<span>' + termWeight + ':</span> ' + o[1] + ' kg';
        detail.querySelector('.age').innerHTML = '<span>Edad:</span> ' + ageText + ' años';
        detail.querySelector('.gender').innerHTML = '<span>' + term_gender + ':</span> ' + (o[10] == 'M' ? term_male : term_female);
        detail.querySelector('.sport').innerHTML = '<span>' + term_sport + ':</span> ' + eventArray[o[8]];
        detail.querySelector('.games').innerHTML = '<span>Juegos:</span> ' + o[14] + ' (' + o[15] + ')';
        detail.querySelector('.city').innerHTML = '<span>Ciudad:</span> ' + o[16];
        detail.querySelector('.medals-summary').innerHTML = '<span>Medallas:</span> ' + 
            '<span class="gold-count">' + o[4] + ' Oro</span>, ' +
            '<span class="silver-count">' + o[5] + ' Plata</span>, ' +
            '<span class="bronze-count">' + o[6] + ' Bronce</span>';
        
        var medalHtml = '';
        o[11].forEach(function(m) {
            medalHtml += '<li class="' + m[1] + '">' + m[0] + '</li>';
        });
        document.getElementById('olympian_medals').innerHTML = medalHtml;

        var eventHtml = '';
        o[17].forEach(function(e) {
            var medalClass = '';
            var medalIcon = '';
            if (e.Medal && e.Medal !== 'NA') {
                medalClass = e.Medal.toLowerCase();
                medalIcon = ' (' + e.Medal + ')';
            }
            
            var details = [];
            if (e.Year) details.push(e.Year);
            if (e.Age) details.push(e.Age + ' años');
            
            var detailText = details.length > 0 ? ' <small>[' + details.join(', ') + ']</small>' : '';
            
            eventHtml += '<li class="' + medalClass + '">' + e.Event + detailText + medalIcon + '</li>';
        });
        document.getElementById('olympian_events').innerHTML = eventHtml;

        detailPanel.style.display = 'block';
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
        
        var rect = el.getBoundingClientRect();
        var top = rect.top;
        var left = rect.left + rect.width/2;
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }
    
    function hideTooltip() {
        tooltip.style.display = 'none';
    }

    function calculatePercentiles(h, w) {
        if (App.State.currentFilteredIndices.length === 0) {
            percentileFeedback.style.display = 'none';
            return;
        }

        var total = App.State.currentFilteredIndices.length;
        var shorterCount = 0;
        var lighterCount = 0;
        var sportStats = {}; 

        App.State.currentFilteredIndices.forEach(function(index) {
            var a = olympianArray[index];
            if (a[0] < h) shorterCount++;
            if (a[1] < w) lighterCount++;
            
            var sIdx = a[8];
            if (!sportStats[sIdx]) sportStats[sIdx] = { hSum: 0, wSum: 0, count: 0 };
            sportStats[sIdx].hSum += a[0];
            sportStats[sIdx].wSum += a[1];
            sportStats[sIdx].count++;
        });

        var heightPercentile = Math.round((shorterCount / total) * 100);
        var weightPercentile = Math.round((lighterCount / total) * 100);

        var minDist = Infinity;
        var closestSportName = '';

        for (var sIdx in sportStats) {
            var stats = sportStats[sIdx];
            var avgH = stats.hSum / stats.count;
            var avgW = stats.wSum / stats.count;
            var dist = Math.sqrt(Math.pow(avgH - h, 2) + Math.pow(avgW - w, 2));
            
            if (dist < minDist) {
                minDist = dist;
                closestSportName = eventArray[sIdx]; 
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

    function searchAthlete(h, w) {
        h = parseInt(h);
        w = parseInt(w);
        
        calculatePercentiles(h, w);
        
        var className = 'hw' + h + '_' + w;
        var el = App.Graph.getDotsLayer().querySelector('.' + className);
        
        if (el) {
            var event = new Event('click', { bubbles: true });
            el.dispatchEvent(event);
            updateStatus(returnExact.replace('{H}', h).replace('{W}', w));
            return;
        }

        var range = App.Config.SEARCH.RANGE;
        for (var d = 1; d <= range; d++) {
            for (var dh = -d; dh <= d; dh++) {
                for (var dw = -d; dw <= d; dw++) {
                    if (Math.abs(dh) !== d && Math.abs(dw) !== d) continue; 
                    
                    var checkH = h + dh;
                    var checkW = w + dw;
                    var checkClass = 'hw' + checkH + '_' + checkW;
                    var checkEl = App.Graph.getDotsLayer().querySelector('.' + checkClass);
                    
                    if (checkEl) {
                        var event = new Event('click', { bubbles: true });
                        checkEl.dispatchEvent(event);
                        var text = returnClosest.replace('{H}', checkH).replace('{W}', checkW);
                        updateStatus("No se encontró exacto. " + text);
                        return;
                    }
                }
            }
        }
        updateStatus("No se encontraron atletas visibles cercanos a " + h + "cm, " + w + "kg.");
    }

    return {
        init: init,
        updateDashboard: updateDashboard,
        updateHiddenCount: updateHiddenCount,
        updateStatus: updateStatus,
        hideDetail: hideDetail,
        clearList: clearList,
        showDetail: showDetail,
        showOlympians: showOlympians,
        showTooltip: showTooltip,
        hideTooltip: hideTooltip,
        searchAthlete: searchAthlete
    };
})();
