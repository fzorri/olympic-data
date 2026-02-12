window.App = window.App || {};

App.Filters = (function() {
    var filterField, filterOperator, filterValueContainer, activeFiltersContainer, addFilterBtn;

    function init() {
        filterField = document.getElementById('filter-field');
        filterOperator = document.getElementById('filter-operator');
        filterValueContainer = document.getElementById('filter-value-container');
        activeFiltersContainer = document.getElementById('active-filters');
        addFilterBtn = document.getElementById('add-filter-btn');

        updateFilterUI();

        filterField.addEventListener('change', updateFilterUI);
        addFilterBtn.addEventListener('click', addFilter);
    }

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
            case 'total_medals':
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

        App.State.activeFilters.push(filter);
        renderActiveFilters();
        applyFilters();
    }

    function removeFilter(index) {
        App.State.activeFilters.splice(index, 1);
        renderActiveFilters();
        applyFilters();
    }

    function renderActiveFilters() {
        activeFiltersContainer.innerHTML = '';
        App.State.activeFilters.forEach((f, i) => {
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
        App.State.activeFilters = [];
        applyFilters();
    }

function applyFilters() {
        App.State.currentFilteredIndices = [];
        App.State.hiddenIndices = [];
        
        olympianArray.forEach((athlete, index) => {
            var pass = true;
            for (var f of App.State.activeFilters) {
                if (!checkCondition(athlete, f)) {
                    pass = false;
                    break;
                }
            }
            if (pass) {
                App.State.currentFilteredIndices.push(index);
                // Check if hidden (missing H or W)
                if (athlete[0] === null || athlete[1] === null || isNaN(athlete[0]) || isNaN(athlete[1])) {
                    App.State.hiddenIndices.push(index);
                }
            }
        });

        App.Graph.render(App.State.currentFilteredIndices);
        App.UI.updateDashboard(App.State.currentFilteredIndices);
        App.UI.updateHiddenCount(App.State.hiddenIndices.length);
        
        // Update geographic visualization if it's initialized
        if (typeof App.Geographic !== 'undefined' && App.Geographic && App.Geographic.initialized) {
            App.Geographic.updateMap(App.State.currentFilteredIndices);
        }
        
        App.UI.clearList();
        App.UI.hideDetail();
        App.UI.updateStatus("Mostrando " + App.State.currentFilteredIndices.length + " atletas.");
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
            case 'total_medals': val = (athlete[4] || 0) + (athlete[5] || 0) + (athlete[6] || 0); break;
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
        
        var isArray = Array.isArray(val);
        
        if (['height', 'weight', 'gold', 'silver', 'bronze', 'total_medals', 'country', 'sport', 'age', 'year'].includes(filter.field)) {
            // val is array for age/year, scalar for others.
            // target is scalar.
            target = parseFloat(target);
        }

        var check = (v, t, op) => {
            v = parseFloat(v); // Ensure comparison as numbers
            switch (op) {
                case '>': return v > t;
                case '<': return v < t;
                case '=': return v == t; 
                case '>=': return v >= t;
                case '<=': return v <= t;
                case 'is': return v == t; 
                case 'is not': return v != t;
                default: return false;
            }
        };

        if (isArray) {
            if (filter.operator === 'is not' || filter.operator === '!=') {
                 return val.some(v => check(v, target, filter.operator));
            }
            return val.some(v => check(v, target, filter.operator));
        } else {
            return check(val, target, filter.operator);
        }
    }

    return {
        init: init,
        apply: applyFilters,
        reset: resetFilters
    };
})();
