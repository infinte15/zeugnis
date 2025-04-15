const getQueryParam = name => new URLSearchParams(window.location.search).get(name);

const createElement = (tag, attributes, text) => {
    const element = document.createElement(tag);
    if (attributes) Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
    if (text) element.textContent = text;
    return element;
};

const dataManager = {
    klasse: getQueryParam('klasse'),
    fach: getQueryParam('fach'),

    loadData: function () {
        const key = `tableData_${this.klasse}_${this.fach}`;
        return JSON.parse(localStorage.getItem(key)) || [];
    },

    saveData: function (data) {
        const key = `tableData_${this.klasse}_${this.fach}`;
        localStorage.setItem(key, JSON.stringify(data));
    },

    deleteDetail: function (value) {
        const data = this.loadData();
        const indexToDelete = data.indexOf(value);
        if (indexToDelete === -1) return;

        const updatedData = data.filter(item => item !== value);
        this.saveData(updatedData);

        const cellData = this.loadCellData();
        const updatedCellData = {};
        let rowIndexOffset = 0;
        for (let rowIndex in cellData) {
            if (parseInt(rowIndex) === indexToDelete + 1) { 
                continue; 
            }
            if (parseInt(rowIndex) > indexToDelete + 1) {
                updatedCellData[parseInt(rowIndex) - 1] = cellData[rowIndex];
            } else {
                updatedCellData[rowIndex] = cellData[rowIndex];
            }
        }
        this.saveCellData(updatedCellData);

        if (updatedData.length === 0) {
            const key = `tableData_${this.klasse}_${this.fach}`;
            localStorage.removeItem(key);
        }
        return updatedData;
    },

    deleteCompletely: function (value) {
        const data = this.loadData();
        const updatedData = data.filter(item => item !== value);
        this.saveData(updatedData);
        return updatedData;
    },

    loadColumnData: function () {
        const key = `columnData_${this.klasse}_${this.fach}`;
        return JSON.parse(localStorage.getItem(key)) || { columnCounts: {}, addExtraColumn: {} };
    },

    saveColumnData: function (columnData) {
        const key = `columnData_${this.klasse}_${this.fach}`;
        localStorage.setItem(key, JSON.stringify(columnData));
    },

    loadCellData: function () {
        const key = `cellData_${this.klasse}_${this.fach}`;
        return JSON.parse(localStorage.getItem(key)) || {};
    },

    saveCellData: function (cellData) {
        const key = `cellData_${this.klasse}_${this.fach}`;
        localStorage.setItem(key, JSON.stringify(cellData));
    },

    updateCellData: function (rowIndex, colIndex, value) {
        let cellData = this.loadCellData();
        if (!cellData[rowIndex]) {
            cellData[rowIndex] = {};
        }
        cellData[rowIndex][colIndex] = value;
        this.saveCellData(cellData);
    }
};

const checkAndSyncData = () => {
    const currentKey = `tableData_${dataManager.klasse}_${dataManager.fach}`;
    const existingData = JSON.parse(localStorage.getItem(currentKey)) || [];

    if (existingData.length > 0) return;

    const allKeys = Object.keys(localStorage);
    const relevantKeys = allKeys.filter(key => key.startsWith(`tableData_${dataManager.klasse}_`));

    if (relevantKeys.length === 0) return;

    let sourceData = [];
    let sourceKey = null;

    for (let key of relevantKeys) {
        let data = JSON.parse(localStorage.getItem(key)) || [];
        if (data.length > 0) {
            sourceData = data;
            sourceKey = key;
            break;
        }
    }

    if (sourceData.length === 0) return;

    const userWantsToSync = confirm("Es gibt bereits Daten in einem anderen Fach. Möchtest du sie übernehmen?");
    if (userWantsToSync) {
        localStorage.setItem(currentKey, JSON.stringify(sourceData));
        tableManager.renderTable(sourceData);
    }
};

const tableManager = {
    table: document.getElementById('itemTable'),

    addRow: value => {
        if (!tableManager.table) return;
        const headerRow = tableManager.table.rows[0];
        if (!headerRow) return;
        const row = tableManager.table.insertRow(-1);
        const deleteCell = row.insertCell(0);
        const deleteBtn = createElement('delete-btn', null, 'Löschen');
        deleteBtn.onclick = () => {
            const confirmation = confirm(`Möchtest du "${value}" wirklich löschen?`);
            if (!confirmation) return;
            dataManager.deleteDetail(value);
            tableManager.renderTable(dataManager.loadData());
            scrollIfNeeded();
        };
        deleteCell.appendChild(deleteBtn);
        const valueCell = row.insertCell(1);
        valueCell.textContent = value;
        for (let i = 2; i < headerRow.cells.length; i++) {
            row.insertCell(i).textContent = "";
        }
        return row;
    },

    clearTable: () => {
        if (!tableManager.table) return;
        while (tableManager.table.rows.length > 1) tableManager.table.deleteRow(1);
    },

    renderTable: data => {
        if (!tableManager.table) return;
        tableManager.clearTable();
        const fragment = document.createDocumentFragment();
        data.sort().forEach(value => {
            const row = tableManager.addRow(value);
            fragment.appendChild(row);
        });
        tableManager.table.appendChild(fragment);
        requestAnimationFrame(() => tableManager.renderColumns());
    },

    renderColumns: () => {
        if (!tableManager.table) return;
    
        const columnData = dataManager.loadColumnData();
        const headerRow = tableManager.table.rows[0];
        if (!headerRow) return; 
    
        const rows = tableManager.table.rows;
        const cellData = dataManager.loadCellData();
        const columnOrder = ['K', 'T', 'H', 'M']; 
    
    
        for (let i = headerRow.cells.length - 1; i >= 2; i--) {
            if (headerRow.cells[i].dataset.columnLetter && headerRow.cells[i].dataset.columnLetter !== 'Durchschnitt') {
                for (let j = 0; j < rows.length; j++) {
                    if (rows[j].cells.length > i) {
                        rows[j].deleteCell(i);
                    }
                }
            }
        }
    
        let insertIndex = 2;
    
        columnOrder.forEach(letter => {
            const count = columnData.columnCounts?.[letter] || 0; 
            for (let i = 0; i < count; i++) {
                for (let j = 0; j < rows.length; j++) {
                    if (!rows[j]) continue; 
                    const cell = rows[j].insertCell(insertIndex);
                    cell.textContent = j === 0 ? letter : (cellData[j]?.[insertIndex] || "").replace(',', '.');
                    cell.dataset.columnLetter = letter;
                }
                insertIndex++;
            }
    
            if (columnData.addExtraColumn?.[letter]) { 
                for (let j = 0; j < rows.length; j++) {
                    if (!rows[j]) continue;
                    const cell = rows[j].insertCell(insertIndex);
                    cell.textContent = j === 0 ? `${letter} Schnitt` : (cellData[j]?.[insertIndex] || "").replace(',', '.');
                    cell.dataset.columnLetter = `${letter}-schnitt`;
                }
                insertIndex++;
            }
        });

        for (let i = 1; i < rows.length; i++) {
            while (rows[i].cells.length < headerRow.cells.length) {
                rows[i].insertCell(rows[i].cells.length).textContent = "";
            }
        }
    
        const schnittIndex = headerRow.cells.length - 1;
        for (let i = 0; i < rows.length; i++) {
            const schnittCell = rows[i].cells[rows[i].cells.length - 2];
            const lastCell = rows[i].cells[rows[i].cells.length - 1];
            if (schnittCell && schnittCell.dataset.columnLetter !== 'Durchschnitt') {
                rows[i].insertBefore(lastCell, rows[i].cells[schnittIndex]);
            }
        }
    
        enableCellEditing();
        enableArrowNavigation();
        updateAverages();
    }
};

const addColumn = letter => {
    const columnData = dataManager.loadColumnData();
    if (!columnData.columnCounts[letter]) {
        columnData.columnCounts[letter] = 0;
        columnData.addExtraColumn[letter] = true;
    }
    columnData.columnCounts[letter]++;
    dataManager.saveColumnData(columnData);
    tableManager.renderTable(dataManager.loadData());
            scrollIfNeeded();
};

const removeColumn = letter => {
    const columnData = dataManager.loadColumnData();
    if (columnData.columnCounts[letter] > 0) {
        columnData.columnCounts[letter]--;
        if (columnData.columnCounts[letter] === 0) {
            delete columnData.addExtraColumn[letter];
            delete columnData.columnCounts[letter];
        }
        dataManager.saveColumnData(columnData);
        tableManager.renderTable(dataManager.loadData());
            scrollIfNeeded();
    }
};

const showInputField = () => {
    const inputContainer = document.getElementById('inputContainer');
    if (inputContainer) inputContainer.style.display = 'block';
};

const addDetail = () => {
    const detailInput = document.getElementById('detailField');
    const detailValue = detailInput ? detailInput.value.trim() : "";
    if (detailValue) {
        const data = dataManager.loadData();
        data.push(detailValue);
        dataManager.saveData(data);
        tableManager.renderTable(data);
        scrollIfNeeded();
        if (detailInput) detailInput.value = "";
    }
};

const updateAverages = () => {
    const table = document.getElementById('itemTable');
    const rows = table.rows;
    const columnData = dataManager.loadColumnData();
    const columnLetters = ['K', 'T', 'H', 'M'];
    
    for (let colLetter of columnLetters) {
        let colIndexes = [];
        let schnittColIndex = -1;
        
        for (let i = 0; i < rows[0].cells.length; i++) {
            if (rows[0].cells[i].dataset.columnLetter === colLetter) {
                colIndexes.push(i);
            } else if (rows[0].cells[i].dataset.columnLetter === `${colLetter}-schnitt`) {
                schnittColIndex = i;
            }
        }
        
        if (schnittColIndex === -1 || colIndexes.length === 0) continue;
        
        for (let i = 1; i < rows.length; i++) {
            let sum = 0;
            let count = 0;
            colIndexes.forEach(index => {
                let value = parseFloat(rows[i].cells[index].textContent.replace(',', '.'));
                if (!isNaN(value)) {
                    sum += value;
                    count++;
                }
            });
            
            const avg = count > 0 ? (sum / count).toFixed(2) : "";
            rows[i].cells[schnittColIndex].textContent = avg;
        }
    }
};



const enableCellEditing = () => {
    const table = document.getElementById('itemTable');
    for (let i = 1; i < table.rows.length; i++) {
        for (let j = 2; j < table.rows[i].cells.length; j++) {
            const cell = table.rows[i].cells[j];
            if (cell.dataset.columnLetter && !cell.dataset.columnLetter.includes('-schnitt')) {
                cell.contentEditable = "true";
                cell.addEventListener("input", () => {
                    dataManager.updateCellData(i, j, cell.textContent);
                    updateAverages();
                });
            } else {
                cell.contentEditable = "false";
            }
        }
    }
};

const enableArrowNavigation = () => {
    const table = document.getElementById('itemTable');

    table.addEventListener('keydown', function (e) {
        const currentCell = document.activeElement;
        if (!currentCell || currentCell.tagName !== 'TD') return;

        const row = currentCell.parentElement;
        const rowIndex = row.rowIndex;
        const cellIndex = currentCell.cellIndex;

        const isSchnitt = (cell) =>
            cell.dataset.columnLetter && cell.dataset.columnLetter.includes('-schnitt');

        // Horizontal nach links/rechts suchen
        const findNextEditableCell = (rowIdx, direction) => {
            let targetIdx = cellIndex;
            do {
                targetIdx += direction;
                if (
                    targetIdx >= 2 &&
                    targetIdx < table.rows[rowIdx].cells.length &&
                    !isSchnitt(table.rows[rowIdx].cells[targetIdx])
                ) {
                    return table.rows[rowIdx].cells[targetIdx];
                }
            } while (
                targetIdx >= 2 &&
                targetIdx < table.rows[rowIdx].cells.length
            );
            return null;
        };

        const findVerticalEditableCell = (rowDirection) => {
            let targetRowIdx = rowIndex + rowDirection;
            while (
                targetRowIdx > 0 &&
                targetRowIdx < table.rows.length
            ) {
                const targetCell = table.rows[targetRowIdx].cells[cellIndex];
                if (targetCell && targetCell.isContentEditable && !isSchnitt(targetCell)) {
                    return targetCell;
                }
                targetRowIdx += rowDirection;
            }
            return null;
        };

        let targetCell = null;

        switch (e.key) {
            case 'ArrowUp':
                targetCell = findVerticalEditableCell(-1);
                break;
            case 'ArrowDown':
                targetCell = findVerticalEditableCell(1);
                break;
            case 'ArrowLeft':
                targetCell = findNextEditableCell(rowIndex, -1);
                break;
            case 'ArrowRight':
                targetCell = findNextEditableCell(rowIndex, 1);
                break;
        }

        if (targetCell) {
            e.preventDefault();
            targetCell.focus();
        }
    });
};

navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    document.getElementById('video').srcObject = stream;
});

function captureAndRead() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    Tesseract.recognize(canvas, 'deu').then(result => {
        const text = result.data.text;
        processRecognizedText(text);
    });
}

function processRecognizedText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const names = [];
    const cellData = {};

    lines.forEach((line, i) => {
        const match = line.match(/^([A-Za-zÄÖÜäöüß\s]+)\s+([\d\s,\.]+)$/);
        if (match) {
            const name = match[1].trim();
            const noten = match[2].trim().split(/\s+/);
            names.push(name);
            cellData[i + 1] = {};
            noten.forEach((note, j) => {
                cellData[i + 1][j + 2] = note.replace(',', '.'); 
            });
        }
    });

    dataManager.saveData(names);
    dataManager.saveCellData(cellData);
    tableManager.renderTable(names);
}

document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            Tesseract.recognize(canvas, 'deu').then(result => {
                const text = result.data.text;
                processRecognizedText(text);
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});


document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById('darkmode-toggle');
    const body = document.body;
    const background = document.querySelector('.background-color');

    function updateDarkMode(isDarkMode) {
        if (isDarkMode) {
            body.classList.add('dark-mode');
            if (background) {
                background.style.backgroundColor = '#121212';
            }
            localStorage.setItem('darkMode', 'enabled');
        } else {
            body.classList.remove('dark-mode');
            if (background) {
                background.style.backgroundColor = '#f0f4f8';
            }
            localStorage.setItem('darkMode', 'disabled');
        }
        if (darkModeToggle) {
            darkModeToggle.checked = isDarkMode;
        }
    }

    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    updateDarkMode(isDarkMode);

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            updateDarkMode(darkModeToggle.checked);
        });
    }
});

window.addEventListener('pageshow', function () {
    const darkModeToggle = document.getElementById('darkmode-toggle');
    if (darkModeToggle) {
        darkModeToggle.checked = localStorage.getItem('darkMode') === 'enabled';
    }
});

// Event-Listener für DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    let pageTitle = document.getElementById('pageTitle');
    if (pageTitle && dataManager.klasse && dataManager.fach) {
        pageTitle.textContent = `Noten in ${decodeURIComponent(dataManager.fach)} in ${decodeURIComponent(dataManager.klasse)}`;
    }
    checkAndSyncData();
    tableManager.renderTable(dataManager.loadData());
            scrollIfNeeded();
});

// Event-Listener
document.getElementById('backButton').addEventListener('click', event => {
    event.preventDefault();
    history.back();
});

window.addEventListener('pageshow', function (event) {
    if (event.persisted && !sessionStorage.getItem("reloaded")) {
        sessionStorage.setItem("reloaded", "true");
        window.location.reload();
    }
});

const scrollIfNeeded = () => {
    const body = document.body;
    const table = document.getElementById('itemTable');
    if (!table) return;

    const tableBottom = table.getBoundingClientRect().bottom;
    const windowHeight = window.innerHeight;

    if (tableBottom > windowHeight) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else if (body.scrollTop > 0 && tableBottom < windowHeight * 0.9) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};