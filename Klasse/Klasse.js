


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
    const confirmation = confirm(`Möchtest du wirklich alles löschen?`);
    if (!confirmation) return;

    const darkModeStatus = localStorage.getItem('darkMode'); 

    localStorage.clear(); 

    localStorage.setItem('darkMode',darkModeStatus);
}

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
    const klassenElemente = document.querySelectorAll('.klasse');
    klassenElemente.forEach(element => {
        element.addEventListener('click', () => {
            const klassenName = element.dataset.klasse;
            window.location.href = `../Fächer/Fächer.html?klasse=${encodeURIComponent(klassenName)}`;
        });
    });
});

document.getElementById('backButton').addEventListener('click', event => {
    event.preventDefault();
    history.back();
});

//Event-Listener für pageshow 
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});