// Hilfsfunktionen

/**
 * Holt den Wert eines Query-Parameters aus der URL.
 * @param param Der Name des Query-Parameters.
 * @returns Der Wert des Parameters oder null, wenn er nicht gefunden wurde.
 */
function getQueryParam(param) {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
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
        const cell = row.insertCell(0);
        const link = createElement('a', {
            href: `../Schüler/Schüler.html?data=${encodeURIComponent(value)}`
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
    clearTable: function () {
        while (this.table.rows.length > 1) {
            this.table.deleteRow(1);
        }
    },
    renderTable: function (data) {
        this.clearTable();
        data.forEach(value => this.addRow(value));
    }
};

// Event-Listener für den Zurück-Button
document.getElementById('backButton').addEventListener('click', function (event) {
    event.preventDefault();
    history.back();
});

// Event-Listener für DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    let pageTitle = document.getElementById('pageTitle');
    if (pageTitle && dataManager.itemName) {
        pageTitle.textContent = `Fächer von ${dataManager.itemName}`;
    }
    tableManager.renderTable(dataManager.loadData());
});

//Event-Listener für pageshow 
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});


/**
 * Zeigt das Eingabefeld zum Hinzufügen eines Details an.
 */
function showInputField() {
    let inputContainer = document.getElementById('inputContainer');
    if (inputContainer) {
        inputContainer.style.display = 'block';
    }
}

/**
 * Fügt ein neues Detail zur Tabelle hinzu.
 */
function addDetail() {
    let detailField = document.getElementById('detailField');
    let detailValue = detailField ? detailField.value.trim() : "";
    if (detailValue) {
        dataManager.saveData([...dataManager.loadData(), detailValue]);
        tableManager.renderTable(dataManager.loadData());
        if (detailField) {
            detailField.value = "";
        }
    }
}