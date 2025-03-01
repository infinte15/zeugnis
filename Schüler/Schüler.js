// Hilfsfunktionen
const getQueryParam = name => new URLSearchParams(window.location.search).get(name);

const createElement = (tag, attributes, text) => {
    const element = document.createElement(tag);
    if (attributes) Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
    if (text) element.textContent = text;
    return element;
};

// Datenverwaltung
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
    }
};

// Tabellenmanipulation
const tableManager = {
    table: document.getElementById('itemTable'),
    addRow: value => {
        if (!tableManager.table) return;
        const row = tableManager.table.insertRow(-1);
        const deleteCell = row.insertCell(0);
        const deleteBtn = createElement('button', null, 'Delete');
        deleteBtn.onclick = () => {
            dataManager.deleteDetail(value);
            tableManager.renderTable(dataManager.loadData());
        };
        deleteCell.appendChild(deleteBtn);
        const cell = row.insertCell(1);
        cell.textContent = value;
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
        tableManager.renderColumns();
    },
    renderColumns: () => {
        const columnData = dataManager.loadColumnData();
        const getColumnOrder = () => ['K', 'T', 'H', 'M'];
        const headerRow = tableManager.table.rows[0];
        const rows = tableManager.table.rows;

        // Vorhandene Spalten löschen
        for (let i = headerRow.cells.length - 2; i > 1; i--) {
            if (headerRow.cells[i].dataset.columnLetter) {
                for (let j = 0; j < rows.length; j++) {
                    rows[j].deleteCell(i);
                }
            }
        }

        // Neue Spalten hinzufügen
        let insertIndex = 2;
        getColumnOrder().forEach(letter => {
            if (columnData.columnCounts[letter] && columnData.columnCounts[letter] > 0) {
                for (let i = 0; i < columnData.columnCounts[letter]; i++) {
                    for (let j = 0; j < rows.length; j++) {
                        rows[j].insertCell(insertIndex);
                        rows[j].cells[insertIndex].textContent = j === 0 ? letter : "";
                        rows[j].cells[insertIndex].dataset.columnLetter = letter;
                    }
                    insertIndex++;
                }
                if (columnData.addExtraColumn[letter]) {
                    for (let j = 0; j < rows.length; j++) {
                        rows[j].insertCell(insertIndex);
                        rows[j].cells[insertIndex].textContent = j === 0 ? letter + " Extra" : "";
                        rows[j].cells[insertIndex].dataset.columnLetter = letter + "-extra";
                    }
                    insertIndex++;
                }
            }
        });

        // Schnitt-Spalte an das Ende verschieben
        const schnittIndex = headerRow.cells.length - 1;
        for (let i = 0; i < rows.length; i++) {
            const schnittCell = rows[i].cells[rows[i].cells.length - 2];
            const lastCell = rows[i].cells[rows[i].cells.length - 1];
            if (schnittCell && schnittCell.dataset.columnLetter !== 'schnitt') {
                rows[i].insertBefore(lastCell, rows[i].cells[schnittIndex]);
            }
        }
    }
};

// Spaltenmanipulation
const addColumn = letter => {
    const columnData = dataManager.loadColumnData();
    if (!columnData.columnCounts[letter]) {
        columnData.columnCounts[letter] = 0;
        columnData.addExtraColumn[letter] = true;
    }
    columnData.columnCounts[letter]++;
    dataManager.saveColumnData(columnData);
    tableManager.renderTable(dataManager.loadData());
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
    }
};

// Event-Listener für DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    let pageTitle = document.getElementById('pageTitle');
    if (pageTitle && dataManager.klasse && dataManager.fach) {
        pageTitle.textContent = `Noten in ${decodeURIComponent(dataManager.fach)} in ${decodeURIComponent(dataManager.klasse)}`;
    }
    tableManager.renderTable(dataManager.loadData());
});

// Event-Listener
document.getElementById('backButton').addEventListener('click', event => {
    event.preventDefault();
    history.back();
});

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
        if (detailInput) detailInput.value = "";
    }
};

window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});