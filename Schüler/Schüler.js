// Hilfsfunktionen

/**
 * Holt den Wert eines Query-Parameters aus der URL.
 * @param name Der Name des Query-Parameters.
 * @returns Der Wert des Parameters oder null, wenn er nicht gefunden wurde.
 */
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Erstellt ein DOM-Element mit angegebenen Attributen und Textinhalt.
 * @param tag Der Tag-Name des zu erstellenden Elements.
 * @param attributes Ein Objekt mit Attributen und ihren Werten.
 * @param text Der Textinhalt des Elements.
 * @returns Das erstellte DOM-Element.
 */
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
        return JSON.parse(localStorage.getItem(`tableData_${this.itemName}`)) || [];
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
        while (this.table.rows.length > 1) {
            this.table.deleteRow(1);
        }
    },
    renderTable: function (data) {
        if (!this.table) return; // Überprüfung ob die Tabelle vorhanden ist.
        this.clearTable();
        data.sort((a, b) => a.localeCompare(b));
        data.forEach(value => {
            const row = this.addRow(value);
            for (let i = 2; i < this.table.rows[0].cells.length; i++) {
                row.insertCell(i);
            }
        });
    }
};

// Spaltenmanipulation
let columnCounts = JSON.parse(localStorage.getItem('columnCounts')) || {};
let addExtraColumn = JSON.parse(localStorage.getItem('addExtraColumn')) || {};

function saveColumnData() {
    localStorage.setItem('columnCounts', JSON.stringify(columnCounts));
    localStorage.setItem('addExtraColumn', JSON.stringify(addExtraColumn));
}

function addColumn(letter) {
    if (!tableManager.table) return;
    const table = tableManager.table;
    const rows = table.rows;

    if (!columnCounts[letter]) {
        columnCounts[letter] = 0;
        addExtraColumn[letter] = true;
    }

    columnCounts[letter]++;

    for (let i = 0; i < rows.length; i++) {
        let insertIndex = rows[i].cells.length - 1;
        if (columnCounts[letter] > 1 && addExtraColumn[letter]) {
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

        if (addExtraColumn[letter] && columnCounts[letter] === 1) {
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
            if (columnCounts[letter] === 1 && extraColumnIndex !== -1) {
                if (extraColumnIndex > lastColumnIndex) {
                    rows[i].deleteCell(extraColumnIndex - 1);
                } else {
                    rows[i].deleteCell(extraColumnIndex);
                }
            }
        }
        columnCounts[letter]--;
        if (columnCounts[letter] === 0) {
            delete addExtraColumn[letter];
        }
    }
    saveColumnData(); 
}

// Event-Listener für DOMContentLoaded (angepasst)
document.addEventListener('DOMContentLoaded', () => {
    let pageTitle = document.getElementById('pageTitle');
    if (pageTitle && dataManager.itemName) {
        pageTitle.textContent = `Noten in ${dataManager.itemName}`;
    }
    tableManager.renderTable(dataManager.loadData());

    // Spalteninformationen wiederherstellen
    Object.keys(columnCounts).forEach(letter => {
        for (let i = 0; i < columnCounts[letter]; i++) {
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
        dataManager.saveData([...dataManager.loadData(), detailValue]);
        tableManager.renderTable(dataManager.loadData());
        if (detailInput) detailInput.value = "";
    }
}