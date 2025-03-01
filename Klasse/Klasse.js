localStorage.clear();
// Hilfsfunktionen
function getQueryParam(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
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
    loadData: function () {
        return JSON.parse(localStorage.getItem('klassenData')) || []; // Daten aus localStorage laden
    },
    saveData: function (data) {
        localStorage.setItem('klassenData', JSON.stringify(data)); // Daten in localStorage speichern
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
    table: document.getElementById('dataTable'),
    addRow: function (value) {
        const row = this.table.insertRow(-1);
        const cell = row.insertCell(0);
        const link = createElement('a', {
            href: `../Fächer/Fächer.html?data=${encodeURIComponent(value)}` // Link zur Fächer-Seite mit Klassenname als Query-Parameter
        }, value);
        cell.appendChild(link);

        const deleteCell = row.insertCell(1);
        const deleteBtn = createElement('button', null, 'Delete');
        deleteBtn.onclick = () => {
            dataManager.deleteDetail(value);
            this.renderTable(dataManager.loadData());
        };
        deleteCell.appendChild(deleteBtn);
        return row;
    },
    deleteRow: function (row) {
        this.table.deleteRow(row.rowIndex);
    },
    clearTable: function () {
        while (this.table.rows.length > 1) {
            this.table.deleteRow(1);
        }
    },
    renderTable: function (data) {
        this.clearTable();
        const fragment = document.createDocumentFragment();
        data.sort((a, b) => a.localeCompare(b)).forEach(value => {
            fragment.appendChild(this.addRow(value));
        });
        this.table.appendChild(fragment);
    }
};

// Event-Listener für DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    tableManager.renderTable(dataManager.loadData()); // Daten beim Laden der Seite anzeigen
});

// Funktion zum Anzeigen des Eingabefeldes
function showInputField() {
    let inputContainer = document.getElementById('inputContainer');
    if (inputContainer) {
        inputContainer.style.display = 'block';
    }
}

// Funktion zum Hinzufügen einer Klasse
function addDetail() {
    let inputField = document.getElementById('inputField');
    let inputValue = inputField ? inputField.value.trim() : "";
    if (inputValue) {
        dataManager.saveData([...dataManager.loadData(), inputValue]);
        tableManager.renderTable(dataManager.loadData());
        if (inputField) {
            inputField.value = "";
        }
    }
}
