
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

const darkModeToggle = document.getElementById('darkmode-toggle');
const body = document.body;

// Beim Laden der Seite den gespeicherten Zustand prüfen
const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
if (isDarkMode) {
    body.classList.add('dark-mode');
    darkModeToggle.checked = true;
}

darkModeToggle.addEventListener('change', () => {
    body.classList.toggle('dark-mode');
    // Den Zustand in localStorage speichern
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
});

// Event-Listener für DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const klassenElemente = document.querySelectorAll('.klasse');
    klassenElemente.forEach(element => {
        element.addEventListener('click', () => {
            const klassenName = element.dataset.klasse;
            window.location.href = `../Fächer/Fächer.html?klasse=${encodeURIComponent(klassenName)}`;
        });
    });
});

//Event-Listener für pageshow 
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});