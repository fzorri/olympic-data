window.App = window.App || {};

App.State = {
    activeFilters: [],
    currentFilteredIndices: [],
    hiddenIndices: [],
    transform: { k: 1, x: 0, y: 0 },
    isDragging: false,
    startDrag: { x: 0, y: 0 },
    currentMaxCount: 0
};
