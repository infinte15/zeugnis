function navigateTo() {
    window.location.href = '../Klasse/klasse.html"'; 
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