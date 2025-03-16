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

function deleteAll() {
    const confirmation = confirm(`Möchtest du wirklich alle Inhalte der ${decodeURIComponent(dataManager.klasse)} löschen?`);
    if (!confirmation) return;

    const prefix = `tableData_${dataManager.klasse}_`; 

    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
        }
    });
}



// Datenverwaltung
const dataManager = {
    klasse: getQueryParam('klasse'), 
    loadData: function () { 
        const key = `tableData_${this.klasse}`;
        return JSON.parse(localStorage.getItem(key)) || [];
    },
    saveData: function (data) {
        const key = `tableData_${this.klasse}`;
        localStorage.setItem(key, JSON.stringify(data));
    },
    deleteDetail: function (value) {
        const data = this.loadData();
        const updatedData = data.filter(item => item !== value);
        this.saveData(updatedData);
        return updatedData;
    }
};

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
    if (pageTitle && dataManager.klasse) {
        pageTitle.textContent = `Fächer von ${decodeURIComponent(dataManager.klasse)}`;
    }

    const fächerDivs = document.querySelectorAll('.fächer');
    fächerDivs.forEach(fachDiv => {
        fachDiv.addEventListener('click', () => {
            const fachName = fachDiv.textContent.trim(); 
            window.location.href = `../Schüler/Schüler.html?klasse=${encodeURIComponent(dataManager.klasse)}&fach=${encodeURIComponent(fachName)}`;
        });
    });

    // Event-Listener für den Zurück-Button
    document.getElementById('backButton').addEventListener('click', function (event) {
        event.preventDefault();
        history.back();
    });
});

//Event-Listener für pageshow 
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});