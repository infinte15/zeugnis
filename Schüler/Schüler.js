// Hilfsfunktionen
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
        const key = `tableData_${this.klasse}_${this.fach}`; // Klasse und Fach berücksichtigen
        return JSON.parse(localStorage.getItem(key)) || [];
    },

    saveData: function (data) {
        const key = `tableData_${this.klasse}_${this.fach}`; // Klasse und Fach berücksichtigen
        localStorage.setItem(key, JSON.stringify(data));
    },

    deleteDetail: function (value) {
        const data = this.loadData();
        const updatedData = data.filter(item => item !== value);
        this.saveData(updatedData);
        return updatedData;
    },

    deleteCompletely: function(value){
        const data = this.loadData();
        const updatedData = data.filter(item => item !== value);
        this.saveData(updatedData);
        if (updatedData.length === 0){
            const key = `tableData_${this.klasse}_${this.fach}`;
            localStorage.removeItem(key);
        }
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

const checkAndSyncData = () => {
    const currentKey = `tableData_${dataManager.klasse}_${dataManager.fach}`;
    const existingData = JSON.parse(localStorage.getItem(currentKey)) || [];

    // Falls es bereits Daten gibt, nichts tun
    if (existingData.length > 0) return;

    // Verfügbare Datenquellen suchen
    const allKeys = Object.keys(localStorage);
    const relevantKeys = allKeys.filter(key => key.startsWith(`tableData_${dataManager.klasse}_`));

    if (relevantKeys.length === 0) return; // Keine anderen Fächer gefunden

    // Erstes Fach mit Daten suchen
    let sourceData = [];
    let sourceKey = null;

    for (let key of relevantKeys) {
        let data = JSON.parse(localStorage.getItem(key)) || [];
        if (data.length > 0) {
            sourceData = data;
            sourceKey = key;
            break; // Erstes nicht-leeres Fach gefunden, also stoppen
        }
    }

    if (sourceData.length === 0) return; // Falls nirgendwo Daten sind, nichts tun

    // Bestätigungsdialog anzeigen
    const userWantsToSync = confirm("Es gibt bereits Daten in einem anderen Fach. Möchtest du sie übernehmen?");
    if (userWantsToSync) {
        localStorage.setItem(currentKey, JSON.stringify(sourceData));
        tableManager.renderTable(sourceData);
    }
};



// Tabellenmanipulation
const tableManager = {
    table: document.getElementById('itemTable'),

    addRow: value => {
        if (!tableManager.table) return;
        
        const headerRow = tableManager.table.rows[0];
        if (!headerRow) return;
        
        const row = tableManager.table.insertRow(-1);
        const columnCount = headerRow.cells.length;

        // Erste Spalte: Löschen-Button
        const deleteCell = row.insertCell(0);
        const deleteBtn = createElement('button', null, 'Delete');
        deleteBtn.onclick = () => {
            const confirmation = confirm(`Möchtest du "${value}" wirklich löschen?`);
            if (!confirmation) return; 
            dataManager.deleteDetail(value);
            tableManager.renderTable(dataManager.loadData());
        };
        deleteCell.appendChild(deleteBtn);

        // Zweite Spalte: Wert
        const valueCell = row.insertCell(1);
        valueCell.textContent = value;

        // Zusätzliche Spalten auffüllen (damit die Zeile genauso viele Spalten hat wie die Kopfzeile)
        for (let i = 2; i < columnCount; i++) {
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
        tableManager.renderColumns();

    },

    renderColumns: () => {
        const columnData = dataManager.loadColumnData();
        const getColumnOrder = () => ['K', 'T', 'H', 'M'];
        const headerRow = tableManager.table.rows[0];
        const rows = tableManager.table.rows;

        // Vorhandene dynamische Spalten löschen
        for (let i = headerRow.cells.length - 1; i >= 2; i--) {
            if (headerRow.cells[i].dataset.columnLetter && headerRow.cells[i].dataset.columnLetter !== 'schnitt') {
                for (let j = 0; j < rows.length; j++) {
                    if (rows[j].cells.length > i) {
                        rows[j].deleteCell(i);
                    }
                }
            }
        }

        // Dynamische Spalten hinzufügen
        let insertIndex = 2;
        getColumnOrder().forEach(letter => {
            const count = columnData.columnCounts[letter] || 0;
            for (let i = 0; i < count; i++) {
                for (let j = 0; j < rows.length; j++) {
                    const cell = rows[j].insertCell(insertIndex);
                    cell.textContent = j === 0 ? letter : "";
                    cell.dataset.columnLetter = letter;
                }
                insertIndex++;
            }
            if (columnData.addExtraColumn[letter]) {
                for (let j = 0; j < rows.length; j++) {
                    const cell = rows[j].insertCell(insertIndex);
                    cell.textContent = j === 0 ? letter + " Extra" : "";
                    cell.dataset.columnLetter = letter + "-extra";
                }
                insertIndex++;
            }
        });

        // Sicherstellen, dass alle Zeilen gleich viele Spalten haben
        const columnCount = headerRow.cells.length;
        for (let i = 1; i < rows.length; i++) {
            while (rows[i].cells.length < columnCount) {
                rows[i].insertCell(rows[i].cells.length).textContent = "";
            }
        }

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

// Event-Listener für DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    let pageTitle = document.getElementById('pageTitle');
    if (pageTitle && dataManager.klasse && dataManager.fach) {
        pageTitle.textContent = `Noten in ${decodeURIComponent(dataManager.fach)} in ${decodeURIComponent(dataManager.klasse)}`;
    }
    checkAndSyncData();
    tableManager.renderTable(dataManager.loadData());
});

// Event-Listener
document.getElementById('backButton').addEventListener('click', event => {
    event.preventDefault();
    history.back();
});

window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});