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
    itemName: getQueryParam('data'),
    loadData: () => {
        try {
            return JSON.parse(localStorage.getItem(`tableData_${dataManager.itemName}`)) || [];
        } catch (e) {
            console.error("Fehler beim Laden der Daten:", e);
            return [];
        }
    },
    saveData: data => localStorage.setItem(`tableData_${dataManager.itemName}`, JSON.stringify(data)),
    deleteDetail: value => dataManager.saveData(dataManager.loadData().filter(item => item !== value))
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
            for (let i = 2; i < tableManager.table.rows[0].cells.length; i++) row.insertCell(i);
            fragment.appendChild(row);
        });
        tableManager.table.appendChild(fragment);
    }
};

// Spaltenmanipulation
let columnData = JSON.parse(localStorage.getItem('columnData')) || { columnCounts: {}, addExtraColumn: {} };
if (!columnData.columnCounts) columnData.columnCounts = {};
if (!columnData.addExtraColumn) columnData.addExtraColumn = {};

const saveColumnData = () => localStorage.setItem('columnData', JSON.stringify(columnData));
const getColumnOrder = () => ['K', 'T', 'H', 'M'];

const addColumn = letter => {
    if (!tableManager.table) return;
    const table = tableManager.table;
    const rows = table.rows;
    const order = getColumnOrder();
    const letterIndex = order.indexOf(letter);
    let insertIndex = 2; // Nach "Schüler"

    if (!columnData.columnCounts[letter]) {
        columnData.columnCounts[letter] = 0;
        columnData.addExtraColumn[letter] = true;
    }

    columnData.columnCounts[letter]++;

    // Finde den Einfügeindex basierend auf der Reihenfolge der Buchstaben
    for (let k = 2; k < rows[0].cells.length - 1; k++) {
        if (rows[0].cells[k].dataset.columnLetter && rows[0].cells[k].dataset.columnLetter.startsWith(letter)) {
            insertIndex = k;
            break;
        }
    }

    // Extra-Spalte nur hinzufügen, wenn es die erste Spalte des Buchstabens ist
    if (columnData.addExtraColumn[letter] && columnData.columnCounts[letter] === 1) {
        for (let i = 0; i < rows.length; i++) {
            rows[i].insertCell(insertIndex);
            rows[i].cells[insertIndex].textContent = i === 0 ? letter + " Extra" : "";
            rows[i].cells[insertIndex].dataset.columnLetter = letter + "-extra";
        }
        insertIndex++; // Verschiebe den Einfügeindex für die Hauptspalte
    }

    for (let i = 0; i < rows.length; i++) {
        const cell = rows[i].insertCell(insertIndex);
        cell.textContent = i === 0 ? letter : "";
        cell.dataset.columnLetter = letter;
    }

    // Stelle sicher, dass "Schnitt" immer am Ende bleibt
    const schnittIndex = rows[0].cells.length - 1;
    for (let i = 0; i < rows.length; i++) {
        const schnittCell = rows[i].cells[rows[i].cells.length - 2];
        const lastCell = rows[i].cells[rows[i].cells.length - 1];
        if (schnittCell && schnittCell.dataset.columnLetter !== 'schnitt') {
            rows[i].insertBefore(lastCell, rows[i].cells[schnittIndex]);
        }
    }

    saveColumnData();
};

const removeColumn = letter => {
    if (!tableManager.table) return;
    const table = tableManager.table;
    const rows = table.rows;
    let columnIndexes = [];
    let extraColumnIndex = -1;

    for (let i = 2; i < rows[0].cells.length - 1; i++) {
        if (rows[0].cells[i].dataset.columnLetter === letter) columnIndexes.push(i);
        else if (rows[0].cells[i].dataset.columnLetter === letter + "-extra") extraColumnIndex = i;
    }

    if (columnIndexes.length > 0) {
        const lastColumnIndex = columnIndexes[columnIndexes.length - 1];

        for (let i = 0; i < rows.length; i++) {
            if (extraColumnIndex !== -1) {
                rows[i].deleteCell(extraColumnIndex);
            }
            rows[i].deleteCell(lastColumnIndex);
        }
        columnData.columnCounts[letter]--;
        if (columnData.columnCounts[letter] === 0) {
            delete columnData.addExtraColumn[letter];
            delete columnData.columnCounts[letter];
        }
    }
    saveColumnData();
};

// Event-Listener für DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle && dataManager.itemName) pageTitle.textContent = `Noten in ${dataManager.itemName}`;
    tableManager.renderTable(dataManager.loadData());

    getColumnOrder().forEach(letter => {
        if (columnData.columnCounts[letter] && columnData.columnCounts[letter] > 0) {
            for (let i = 0; i < columnData.columnCounts[letter]; i++) {
                if (!document.querySelector(`[data-column-letter="${letter}"]`)) addColumn(letter);
            }
        }
    });

    Object.keys(columnData.columnCounts).forEach(letter => {
        if (!getColumnOrder().includes(letter)) {
            for (let i = 0; i < columnData.columnCounts[letter]; i++) addColumn(letter);
        }
    });
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