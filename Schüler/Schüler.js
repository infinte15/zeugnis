document.addEventListener('DOMContentLoaded', () => {


// Hilfsfunktionen
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function createElement(tag, attributes, text) {
    const element = document.createElement(tag);
    if (attributes) {
        Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
    }
    if (text) element.textContent = text;
    return element;
}

// Datenverwaltung
const dataManager = {
    itemName: getQueryParam('data'),
    loadData: function () {
        try {
            return JSON.parse(localStorage.getItem(`tableData_${this.itemName}`)) || [];
        } catch (e) {
            console.error("Fehler beim Laden der Daten:", e);
            return [];
        }
    },
    saveData: function (data) {
        localStorage.setItem(`tableData_${this.itemName}`, JSON.stringify(data));
    },
    deleteDetail: function (value) {
        const data = this.loadData();
        const updatedData = data.filter(item => item !== value);
        this.saveData(updatedData);
        return updatedData;
    }
};

// Tabellenmanipulation
const tableManager = {
    table: document.getElementById('itemTable'),
    addRow: function (value) {
        if (!this.table) return;
        const row = this.table.insertRow(-1);
        const deleteCell = row.insertCell(0);
        const deleteBtn = createElement('button', null, 'Delete');
        deleteBtn.onclick = () => {
            dataManager.deleteDetail(value);
            this.renderTable(dataManager.loadData());
        };
        deleteCell.appendChild(deleteBtn);
        const cell = row.insertCell(1);
        cell.textContent = value;
        return row;
    },
    clearTable: function () {
        if (!this.table) return;
        while (this.table.rows.length > 1) {
            this.table.deleteRow(1);
        }
    },
    renderTable: function (data) {
        if (!this.table) return;
        this.clearTable();
        const fragment = document.createDocumentFragment();
        data.sort((a, b) => a.localeCompare(b)).forEach(value => {
            const row = this.addRow(value);
            for (let i = 2; i < this.table.rows[0].cells.length; i++) {
                row.insertCell(i);
            }
            fragment.appendChild(row);
        });
        tableManager.table.appendChild(fragment);
    }
};

// Spaltenmanipulation 
let columnData = JSON.parse(localStorage.getItem('columnData')) || {
    columnCounts: {},
    addExtraColumn: {}
};

function saveColumnData() {
    localStorage.setItem('columnData', JSON.stringify(columnData));
}

function getColumnOrder() {
    return ['K', 'T', 'H', 'M'];
}

function addColumn(letter) {
    if (!tableManager.table) return;
    const table = tableManager.table;
    const rows = table.rows;

    if (!columnData.columnCounts[letter]) {
        columnData.columnCounts[letter] = 0;
        columnData.addExtraColumn[letter] = true;
    }

    columnData.columnCounts[letter]++;

    for (let i = 0; i < rows.length; i++) {
        let insertIndex = rows[i].cells.length - 1;
        if (columnData.columnCounts[letter] > 1 && columnData.addExtraColumn[letter]) {
            let extraColumnIndex = -1;
            for (let j = 0; j < rows[i].cells.length; j++) {
                if (rows[i].cells[j].dataset.columnLetter === letter + "-extra") {
                    extraColumnIndex = j;
                    break;
                }
            }
            if (extraColumnIndex !== -1) {
                insertIndex = extraColumnIndex;
            }
        }

        const cell = rows[i].insertCell(insertIndex);
        cell.textContent = i === 0 ? letter : "";
        cell.dataset.columnLetter = letter;

        if (columnData.addExtraColumn[letter] && columnData.columnCounts[letter] === 1) {
            const extraCell = rows[i].insertCell(insertIndex + 1);
            extraCell.textContent = i === 0 ? letter + " Extra" : "";
            extraCell.dataset.columnLetter = letter + "-extra";
        }
    }
    saveColumnData();
}

function removeColumn(letter) {
    if (!tableManager.table) return;
    const table = tableManager.table;
    const rows = table.rows;
    let columnIndexes = [];
    let extraColumnIndex = -1;

    for (let i = 1; i < rows[0].cells.length; i++) {
        if (rows[0].cells[i].dataset.columnLetter === letter) {
            columnIndexes.push(i);
        } else if (rows[0].cells[i].dataset.columnLetter === letter + "-extra") {
            extraColumnIndex = i;
        }
    }

    if (columnIndexes.length > 0) {
        const lastColumnIndex = columnIndexes[columnIndexes.length - 1];

        for (let i = 0; i < rows.length; i++) {
            rows[i].deleteCell(lastColumnIndex);
            if (columnData.columnCounts[letter] === 1 && extraColumnIndex !== -1) {
                if (extraColumnIndex > lastColumnIndex) {
                    rows[i].deleteCell(extraColumnIndex - 1);
                } else {
                    rows[i].deleteCell(extraColumnIndex);
                }
            }
        }
        columnData.columnCounts[letter]--;
        if (columnData.columnCounts[letter] === 0) {
            delete columnData.addExtraColumn[letter];
        }
    }
    saveColumnData();
}

// Event-Listener für DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    let pageTitle = document.getElementById('pageTitle');
    if (pageTitle && dataManager.itemName) {
        pageTitle.textContent = `Noten in ${dataManager.itemName}`;
    }
    tableManager.renderTable(dataManager.loadData());

    // Spalteninformationen wiederherstellen
    Object.keys(columnData.columnCounts).forEach(letter => {
        for (let i = 0; i < columnData.columnCounts[letter]; i++) {
            addColumn(letter);
        }
    });
});

// Event-Listener
document.getElementById('backButton').addEventListener('click', function (event) {
    event.preventDefault();
    history.back();
});

function showInputField() {
    const inputContainer = document.getElementById('inputContainer');
    if (inputContainer) inputContainer.style.display = 'block';
}

function addDetail() {
    const detailInput = document.getElementById('detailField');
    const detailValue = detailInput ? detailInput.value.trim() : "";
    if (detailValue) {
        const data = dataManager.loadData();
        data.push(detailValue);
        dataManager.saveData(data);
        tableManager.renderTable(data);
        if (detailInput) detailInput.value = "";
    }
}
});