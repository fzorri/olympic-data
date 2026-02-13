window.App = window.App || {};

App.Table = (function() {
    var tableContainer, exportContainer, tableElement, statusElement;
    var currentData = [];
    var filteredIndices = [];
    
    // Pagination settings
    var PAGE_SIZE = App.Config.TABLE.PAGE_SIZE;
    var currentPage = 1;
    var totalPages = 1;
    
    // Sorting state
    var currentSortColumn = null;
    var currentSortDirection = 'asc'; // 'asc' or 'desc'
    
    // Column definitions with their types for proper sorting
    var columnDefinitions = [
        { key: 'name', label: 'Nombre', type: 'string' },
        { key: 'country', label: 'País', type: 'string' },
        { key: 'sport', label: 'Deporte', type: 'string' },
        { key: 'height', label: 'Estatura (cm)', type: 'number' },
        { key: 'weight', label: 'Peso (kg)', type: 'number' },
        { key: 'age', label: 'Edad', type: 'number' },
        { key: 'gender', label: 'Género', type: 'string' },
        { key: 'gold', label: 'Oro', type: 'number' },
        { key: 'silver', label: 'Plata', type: 'number' },
        { key: 'bronze', label: 'Bronce', type: 'number' },
        { key: 'total_medals', label: 'Total', type: 'number' }
    ];

    function init() {
        tableContainer = document.getElementById('table-container');
        exportContainer = document.getElementById('table-export');
        
        if (!tableContainer) {
            console.error('Table container not found');
            return;
        }

        renderExportButtons();
    }

    function renderExportButtons() {
        if (!exportContainer) return;
        
        exportContainer.innerHTML = 
            '<div class="export-controls">' +
            '<span class="export-label">Exportar:</span>' +
            '<button class="export-btn" data-format="json">JSON</button>' +
            '<button class="export-btn" data-format="csv">CSV</button>' +
            '<button class="export-btn" data-format="markdown">Markdown</button>' +
            '</div>' +
            '<div class="copy-notification" id="copy-notification" style="display:none;">¡Copiado al portapapeles!</div>';

        // Add event listeners
        exportContainer.querySelectorAll('.export-btn').forEach(function(btn) {
            btn.addEventListener('click', handleExport);
        });
    }

    function handleExport(e) {
        var format = e.target.getAttribute('data-format');
        
        if (currentData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        switch(format) {
            case 'json':
                exportJSON();
                break;
            case 'csv':
                exportCSV();
                break;
            case 'markdown':
                exportMarkdown();
                break;
        }
    }

    function exportJSON() {
        var dataStr = JSON.stringify(currentData, null, 2);
        var blob = new Blob([dataStr], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        
        var a = document.createElement('a');
        a.href = url;
        a.download = 'atletas-olimpicos.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportCSV() {
        if (currentData.length === 0) return;

        var headers = Object.keys(currentData[0]);
        var csvContent = headers.join(',') + '\n';
        
        currentData.forEach(function(row) {
            var values = headers.map(function(header) {
                var value = row[header];
                // Escape values with commas or quotes
                if (typeof value === 'string' && (value.indexOf(',') > -1 || value.indexOf('"') > -1)) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                return value !== null && value !== undefined ? value : '';
            });
            csvContent += values.join(',') + '\n';
        });

        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        
        var a = document.createElement('a');
        a.href = url;
        a.download = 'atletas-olimpicos.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportMarkdown() {
        if (currentData.length === 0) return;

        var headers = Object.keys(currentData[0]);
        var headerLabels = {
            'name': 'Nombre',
            'country': 'País',
            'sport': 'Deporte',
            'height': 'Estatura (cm)',
            'weight': 'Peso (kg)',
            'age': 'Edad',
            'gender': 'Género',
            'gold': 'Oro',
            'silver': 'Plata',
            'bronze': 'Bronce',
            'total_medals': 'Total Medallas',
            'games': 'Juegos'
        };

        // Build markdown table
        var mdContent = '| ' + headers.map(function(h) { return headerLabels[h] || h; }).join(' | ') + ' |\n';
        mdContent += '|' + headers.map(function() { return ' --- '; }).join('|') + '|\n';

        currentData.forEach(function(row) {
            var values = headers.map(function(header) {
                var value = row[header];
                if (value === null || value === undefined) return '';
                return String(value).replace(/\|/g, '\\|');
            });
            mdContent += '| ' + values.join(' | ') + ' |\n';
        });

        // Copy to clipboard
        copyToClipboard(mdContent);
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showCopyNotification();
            }).catch(function(err) {
                console.error('Error al copiar:', err);
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    }

    function fallbackCopyToClipboard(text) {
        var textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopyNotification();
        } catch (err) {
            console.error('Error al copiar:', err);
            alert('No se pudo copiar al portapapeles. Por favor, copia manualmente.');
        }
        
        document.body.removeChild(textArea);
    }

    function showCopyNotification() {
        var notification = document.getElementById('copy-notification');
        if (notification) {
            notification.style.display = 'block';
            setTimeout(function() {
                notification.style.display = 'none';
            }, 2000);
        }
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderTableBody();
        updatePaginationInfo();
    }

    function handleSort(columnKey) {
        // If clicking the same column, toggle direction
        if (currentSortColumn === columnKey) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New column, start with ascending
            currentSortColumn = columnKey;
            currentSortDirection = 'asc';
        }
        
        // Sort the data
        sortData();
        
        // Reset to page 1 and re-render
        currentPage = 1;
        renderTableBody();
        updateHeaderStyles();
        updatePaginationInfo();
    }

    function sortData() {
        if (!currentSortColumn) return;
        
        var columnDef = columnDefinitions.find(function(col) { return col.key === currentSortColumn; });
        if (!columnDef) return;
        
        var isNumeric = columnDef.type === 'number';
        var multiplier = currentSortDirection === 'asc' ? 1 : -1;
        
        currentData.sort(function(a, b) {
            var valA = a[currentSortColumn];
            var valB = b[currentSortColumn];
            
            // Handle null values - always put them at the END regardless of sort direction
            // This ensures actual data is always visible first when sorting
            if (valA === null && valB === null) return 0;
            if (valA === null) return 1;      // A is null, put it after B
            if (valB === null) return -1;     // B is null, put A before B
            
            if (isNumeric) {
                // Numeric comparison
                return (valA - valB) * multiplier;
            } else {
                // String comparison (case-insensitive)
                var strA = String(valA).toLowerCase();
                var strB = String(valB).toLowerCase();
                
                if (strA < strB) return -1 * multiplier;
                if (strA > strB) return 1 * multiplier;
                return 0;
            }
        });
    }

    function updateHeaderStyles() {
        var headers = document.querySelectorAll('#athletes-table th');
        headers.forEach(function(th, index) {
            var colDef = columnDefinitions[index];
            if (!colDef) return;
            
            // Remove existing sort classes
            th.classList.remove('sort-asc', 'sort-desc');
            
            // Add appropriate class if this is the sorted column
            if (colDef.key === currentSortColumn) {
                th.classList.add('sort-' + currentSortDirection);
            }
        });
    }

    function renderPaginationControls() {
        if (totalPages <= 1) return '';
        
        var startPage = Math.max(1, currentPage - 2);
        var endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        var html = '<div class="pagination-controls">';
        
        // Previous button
        html += '<button class="pagination-btn" data-page="' + (currentPage - 1) + '" ' + 
                (currentPage === 1 ? 'disabled' : '') + '>← Anterior</button>';
        
        // Page numbers
        html += '<span class="pagination-pages">';
        if (startPage > 1) {
            html += '<button class="pagination-btn page-num" data-page="1">1</button>';
            if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
        }
        
        for (var i = startPage; i <= endPage; i++) {
            html += '<button class="pagination-btn page-num' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
            html += '<button class="pagination-btn page-num" data-page="' + totalPages + '">' + totalPages + '</button>';
        }
        html += '</span>';
        
        // Next button
        html += '<button class="pagination-btn" data-page="' + (currentPage + 1) + '" ' + 
                (currentPage === totalPages ? 'disabled' : '') + '>Siguiente →</button>';
        
        html += '</div>';
        
        return html;
    }

    function updatePaginationInfo() {
        var paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) {
            paginationContainer.innerHTML = renderPaginationControls();
            
            // Add event listeners
            paginationContainer.querySelectorAll('.pagination-btn:not([disabled])').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var page = parseInt(this.getAttribute('data-page'));
                    goToPage(page);
                });
            });
        }
        
        // Update stats
        var statsEl = document.getElementById('table-stats');
        if (statsEl) {
            var startRecord = (currentPage - 1) * PAGE_SIZE + 1;
            var endRecord = Math.min(currentPage * PAGE_SIZE, currentData.length);
            var sortInfo = currentSortColumn ? ' <span class="sort-info">(Ordenado por: ' + 
                columnDefinitions.find(function(c) { return c.key === currentSortColumn; }).label + 
                ' ' + (currentSortDirection === 'asc' ? '↑' : '↓') + ')</span>' : '';
            statsEl.innerHTML = 'Mostrando <strong>' + startRecord + '-' + endRecord + '</strong> de <strong>' + 
                               currentData.length + '</strong> atletas' +
                               (totalPages > 1 ? ' (Página ' + currentPage + ' de ' + totalPages + ')' : '') +
                               sortInfo;
        }
    }

    function renderTableBody() {
        var tbody = document.querySelector('#athletes-table tbody');
        if (!tbody) return;
        
        var startIdx = (currentPage - 1) * PAGE_SIZE;
        var endIdx = Math.min(startIdx + PAGE_SIZE, currentData.length);
        var pageData = currentData.slice(startIdx, endIdx);
        
        var html = '';
        pageData.forEach(function(athlete) {
            html += '<tr>' +
                '<td class="athlete-name">' + athlete.name + '</td>' +
                '<td>' + athlete.country + '</td>' +
                '<td>' + athlete.sport + '</td>' +
                '<td>' + (athlete.height !== null ? athlete.height : '-') + '</td>' +
                '<td>' + (athlete.weight !== null ? athlete.weight : '-') + '</td>' +
                '<td>' + (athlete.age !== null ? athlete.age : '-') + '</td>' +
                '<td>' + (athlete.gender === 'M' ? 'Hombre' : 'Mujer') + '</td>' +
                '<td class="medal gold">' + athlete.gold + '</td>' +
                '<td class="medal silver">' + athlete.silver + '</td>' +
                '<td class="medal bronze">' + athlete.bronze + '</td>' +
                '<td class="medal total">' + athlete.total_medals + '</td>' +
                '</tr>';
        });
        
        tbody.innerHTML = html;
    }

    function renderTableHeaders() {
        var thead = document.querySelector('#athletes-table thead tr');
        if (!thead) return;
        
        var html = '';
        columnDefinitions.forEach(function(col) {
            var sortClass = '';
            var sortIndicator = '';
            
            if (col.key === currentSortColumn) {
                sortClass = 'sort-' + currentSortDirection;
                sortIndicator = currentSortDirection === 'asc' ? ' ↑' : ' ↓';
            }
            
            html += '<th class="sortable ' + sortClass + '" data-column="' + col.key + '">' +
                   col.label + sortIndicator + '</th>';
        });
        
        thead.innerHTML = html;
        
        // Add click listeners
        thead.querySelectorAll('th.sortable').forEach(function(th) {
            th.addEventListener('click', function() {
                var columnKey = this.getAttribute('data-column');
                handleSort(columnKey);
            });
        });
    }

    function render(indices) {
        if (!tableContainer) return;

        // Store all indices for export
        filteredIndices = indices;
        
        // Process all data but only render subset
        currentData = indices.map(function(idx) {
            return getAthleteData(idx);
        });
        
        // Reset to page 1 when filters change
        currentPage = 1;
        totalPages = Math.ceil(currentData.length / PAGE_SIZE);
        if (totalPages < 1) totalPages = 1;

        // Build table HTML structure
        var html = '<div id="table-stats" class="table-stats"></div>';
        
        if (currentData.length === 0) {
            html += '<div class="no-data">No hay atletas que coincidan con los filtros seleccionados.</div>';
            tableContainer.innerHTML = html;
            return;
        }

        html += '<div class="table-wrapper">';
        html += '<table id="athletes-table">';
        html += '<thead><tr></tr></thead>';
        html += '<tbody></tbody></table>';
        html += '</div>';
        
        html += '<div id="pagination-container"></div>';

        tableContainer.innerHTML = html;
        
        // Render headers and initial page
        renderTableHeaders();
        renderTableBody();
        updatePaginationInfo();
    }

    function getAthleteData(index) {
        var athlete = olympianArray[index];
        
        // Schema: [Height, Weight, Slug, [NameParts], Gold, Silver, Bronze, CountryIdx, SportIdx, NOC, Gender, [[Event, Medal], ...], [Ages], [Years], Games, Season, City, ...]
        var height = athlete[0];
        var weight = athlete[1];
        var nameParts = athlete[3];
        var name = nameParts ? nameParts.join(' ') : '';
        var gold = athlete[4];
        var silver = athlete[5];
        var bronze = athlete[6];
        var countryIdx = athlete[7];
        var sportIdx = athlete[8];
        var gender = athlete[10];
        var ages = athlete[12];
        var games = athlete[14];

        // Get primary age (first age in array or null)
        var age = (ages && ages.length > 0) ? ages[0] : null;

        return {
            name: name,
            country: countryArray[countryIdx] || '',
            sport: eventArray[sportIdx] || '',
            height: height,
            weight: weight,
            age: age,
            gender: gender,
            gold: gold,
            silver: silver,
            bronze: bronze,
            total_medals: gold + silver + bronze,
            games: games || ''
        };
    }

    // Public API
    return {
        init: init,
        render: render
    };

})();
