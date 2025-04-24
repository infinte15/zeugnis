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
        const key = `tableData_${this.klasse}_${this.fach}`;
        return JSON.parse(localStorage.getItem(key)) || [];
    },

    saveData: function (data) {
        const key = `tableData_${this.klasse}_${this.fach}`;
        localStorage.setItem(key, JSON.stringify(data));
    },

    deleteDetail: function (value) {
        const data = this.loadData();
        const indexToDelete = data.indexOf(value);
        if (indexToDelete === -1) return;

        const updatedData = data.filter(item => item !== value);
        this.saveData(updatedData);

        const cellData = this.loadCellData();
        const updatedCellData = {};
        let rowIndexOffset = 0;
        for (let rowIndex in cellData) {
            if (parseInt(rowIndex) === indexToDelete + 1) { 
                continue; 
            }
            if (parseInt(rowIndex) > indexToDelete + 1) {
                updatedCellData[parseInt(rowIndex) - 1] = cellData[rowIndex];
            } else {
                updatedCellData[rowIndex] = cellData[rowIndex];
            }
        }
        this.saveCellData(updatedCellData);

        if (updatedData.length === 0) {
            const key = `tableData_${this.klasse}_${this.fach}`;
            localStorage.removeItem(key);
        }
        return updatedData;
    },

    deleteCompletely: function (value) {
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
    },

    loadCellData: function () {
        const key = `cellData_${this.klasse}_${this.fach}`;
        return JSON.parse(localStorage.getItem(key)) || {};
    },

    saveCellData: function (cellData) {
        const key = `cellData_${this.klasse}_${this.fach}`;
        localStorage.setItem(key, JSON.stringify(cellData));
    },

    updateCellData: function (rowIndex, colIndex, value) {
        let cellData = this.loadCellData();
        if (!cellData[rowIndex]) {
            cellData[rowIndex] = {};
        }
        cellData[rowIndex][colIndex] = value;
        this.saveCellData(cellData);
    }
};

const checkAndSyncData = () => {
    const currentKey = `tableData_${dataManager.klasse}_${dataManager.fach}`;
    const existingData = JSON.parse(localStorage.getItem(currentKey)) || [];

    if (existingData.length > 0) return;

    const allKeys = Object.keys(localStorage);
    const relevantKeys = allKeys.filter(key => key.startsWith(`tableData_${dataManager.klasse}_`));

    if (relevantKeys.length === 0) return;

    let sourceData = [];
    let sourceKey = null;

    for (let key of relevantKeys) {
        let data = JSON.parse(localStorage.getItem(key)) || [];
        if (data.length > 0) {
            sourceData = data;
            sourceKey = key;
            break;
        }
    }

    if (sourceData.length === 0) return;

    const userWantsToSync = confirm("Es gibt bereits Daten in einem anderen Fach. Möchtest du sie übernehmen?");
    if (userWantsToSync) {
        localStorage.setItem(currentKey, JSON.stringify(sourceData));
        tableManager.renderTable(sourceData);
    }
};

const tableManager = {
    table: document.getElementById('itemTable'),

    addRow: value => {
        if (!tableManager.table) return;
        const headerRow = tableManager.table.rows[0];
        if (!headerRow) return;
        const row = tableManager.table.insertRow(-1);
        const deleteCell = row.insertCell(0);
        const deleteBtn = createElement('delete-btn', null, 'Löschen');
        deleteBtn.onclick = () => {
            const confirmation = confirm(`Möchtest du "${value}" wirklich löschen?`);
            if (!confirmation) return;
            dataManager.deleteDetail(value);
            tableManager.renderTable(dataManager.loadData());
            scrollIfNeeded();
        };
        deleteCell.appendChild(deleteBtn);
        const valueCell = row.insertCell(1);
        valueCell.textContent = value;
        for (let i = 2; i < headerRow.cells.length; i++) {
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
       /* data.sort().forEach(value => {
            const row = tableManager.addRow(value);
            fragment.appendChild(row);
        });*/
        data.forEach(value => {
            const row = tableManager.addRow(value);
            fragment.appendChild(row);
        });
        tableManager.table.appendChild(fragment);
        requestAnimationFrame(() => tableManager.renderColumns());
    },

    renderColumns: () => {
        if (!tableManager.table) return;
    
        const columnData = dataManager.loadColumnData();
        const headerRow = tableManager.table.rows[0];
        if (!headerRow) return; 
    
        const rows = tableManager.table.rows;
        const cellData = dataManager.loadCellData();
        const columnOrder = ['K', 'T', 'H', 'M']; 
    
    
        for (let i = headerRow.cells.length - 1; i >= 2; i--) {
            if (headerRow.cells[i].dataset.columnLetter && headerRow.cells[i].dataset.columnLetter !== 'Durchschnitt') {
                for (let j = 0; j < rows.length; j++) {
                    if (rows[j].cells.length > i) {
                        rows[j].deleteCell(i);
                    }
                }
            }
        }
    
        let insertIndex = 2;
    
        columnOrder.forEach(letter => {
            const count = columnData.columnCounts?.[letter] || 0; 
            for (let i = 0; i < count; i++) {
                for (let j = 0; j < rows.length; j++) {
                    if (!rows[j]) continue; 
                    const cell = rows[j].insertCell(insertIndex);
                    const rawValue = cellData[j]?.[insertIndex];
                    cell.textContent = j === 0 ? letter : (rawValue !== undefined ? String(rawValue).replace(',', '.') : "");

                    cell.dataset.columnLetter = letter;
                }
                insertIndex++;
            }
    
            if (columnData.addExtraColumn?.[letter]) { 
                for (let j = 0; j < rows.length; j++) {
                    if (!rows[j]) continue;
                    const cell = rows[j].insertCell(insertIndex);
                    cell.textContent = j === 0 ? `${letter} Schnitt` : (cellData[j]?.[insertIndex] || "").replace(',', '.');
                    cell.dataset.columnLetter = `${letter}-schnitt`;
                }
                insertIndex++;
            }
        });

        for (let i = 1; i < rows.length; i++) {
            while (rows[i].cells.length < headerRow.cells.length) {
                rows[i].insertCell(rows[i].cells.length).textContent = "";
            }
        }
    
        const schnittIndex = headerRow.cells.length - 1;
        for (let i = 0; i < rows.length; i++) {
            const schnittCell = rows[i].cells[rows[i].cells.length - 2];
            const lastCell = rows[i].cells[rows[i].cells.length - 1];
            if (schnittCell && schnittCell.dataset.columnLetter !== 'Durchschnitt') {
                rows[i].insertBefore(lastCell, rows[i].cells[schnittIndex]);
            }
        }
    
        enableCellEditing();
        enableArrowNavigation();
        updateAverages();
    }
};

const addColumn = letter => {
    const columnData = dataManager.loadColumnData();
    if (!columnData.columnCounts[letter]) {
        columnData.columnCounts[letter] = 0;
        columnData.addExtraColumn[letter] = true;
    }
    columnData.columnCounts[letter]++;
    dataManager.saveColumnData(columnData);
    tableManager.renderTable(dataManager.loadData());
    scrollIfNeeded();
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
            scrollIfNeeded();
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
        scrollIfNeeded();
        if (detailInput) detailInput.value = "";
    }
};

const updateAverages = () => {
    const table = document.getElementById('itemTable');
    const rows = table.rows;
    const columnData = dataManager.loadColumnData();
    const columnLetters = ['K', 'T', 'H', 'M'];
    
    for (let colLetter of columnLetters) {
        let colIndexes = [];
        let schnittColIndex = -1;
        
        for (let i = 0; i < rows[0].cells.length; i++) {
            if (rows[0].cells[i].dataset.columnLetter === colLetter) {
                colIndexes.push(i);
            } else if (rows[0].cells[i].dataset.columnLetter === `${colLetter}-schnitt`) {
                schnittColIndex = i;
            }
        }
        
        if (schnittColIndex === -1 || colIndexes.length === 0) continue;
        
        for (let i = 1; i < rows.length; i++) {
            let sum = 0;
            let count = 0;
            colIndexes.forEach(index => {
                let value = parseFloat(rows[i].cells[index].textContent.replace(',', '.'));
                if (!isNaN(value)) {
                    sum += value;
                    count++;
                }
            });
            
            const avg = count > 0 ? (sum / count).toFixed(1) : "";
            rows[i].cells[schnittColIndex].textContent = avg;
        }
    }

    const weights = loadWeights();
    const weightSum = ['K','T','H','M'].reduce((sum, key) => sum + (weights[key] || 0), 0);

    if (weightSum > 0) {
        const endNoteIndex = table.rows[0].cells.length - 1;
        table.rows[0].cells[endNoteIndex].textContent = "Endnote";

        for (let i = 1; i < rows.length; i++) {
            let total = 0;

            ['K', 'T', 'H', 'M'].forEach(letter => {
                const colIndex = [...rows[0].cells].findIndex(cell => cell.dataset.columnLetter === `${letter}-schnitt`);
                if (colIndex > -1) {
                    const val = parseFloat(rows[i].cells[colIndex].textContent.replace(',', '.'));
                    if (!isNaN(val)) total += val * (weights[letter] || 0);
                }
            });

            const finalNoteCell = rows[i].cells[endNoteIndex];
            finalNoteCell.textContent = total ? total.toFixed(2) : '';
            finalNoteCell.style.color = 'red';
        }
    }

};



const enableCellEditing = () => {
    const table = document.getElementById('itemTable');
    for (let i = 1; i < table.rows.length; i++) {
        for (let j = 2; j < table.rows[i].cells.length; j++) {
            const cell = table.rows[i].cells[j];
            if (cell.dataset.columnLetter && !cell.dataset.columnLetter.includes('-schnitt')) {
                cell.contentEditable = "true";
                cell.addEventListener("input", () => {
                    dataManager.updateCellData(i, j, cell.textContent);
                    updateAverages();
                });
            } else {
                cell.contentEditable = "false";
            }
        }
    }
};

document.getElementById('weightSettingsBtn').addEventListener('click', () => {
    const weights = loadWeights();
    document.getElementById('weightK').value = weights.K || '';
    document.getElementById('weightT').value = weights.T || '';
    document.getElementById('weightH').value = weights.H || '';
    document.getElementById('weightM').value = weights.M || '';
    document.getElementById('weightModal').style.display = 'flex';
});

function closeWeightModal() {
    document.getElementById('weightModal').style.display = 'none';
}

function saveWeights() {
    const parseWeight = val => {
        if (!val) return 0;
        val = val.trim();
        if (val.includes('%')) return parseFloat(val) / 100;
        if (val.includes('/')) {
            const [a, b] = val.split('/');
            return parseFloat(a) / parseFloat(b);
        }
        return parseFloat(val);
    };

    const weights = {
        K: parseWeight(document.getElementById('weightK').value),
        T: parseWeight(document.getElementById('weightT').value),
        H: parseWeight(document.getElementById('weightH').value),
        M: parseWeight(document.getElementById('weightM').value),
    };
    const key = `weights_${dataManager.klasse}_${dataManager.fach}`;
    localStorage.setItem(key, JSON.stringify(weights));
    document.getElementById('weightModal').style.display = 'none';
    updateAverages(); // Endnoten aktualisieren
}

function loadWeights() {
    const key = `weights_${dataManager.klasse}_${dataManager.fach}`;
    return JSON.parse(localStorage.getItem(key)) || {};
}


const enableArrowNavigation = () => {
    const table = document.getElementById('itemTable');

    table.addEventListener('keydown', function (e) {
        const currentCell = document.activeElement;
        if (!currentCell || currentCell.tagName !== 'TD') return;

        const row = currentCell.parentElement;
        const rowIndex = row.rowIndex;
        const cellIndex = currentCell.cellIndex;

        const isSchnitt = (cell) =>
            cell.dataset.columnLetter && cell.dataset.columnLetter.includes('-schnitt');
        const findNextEditableCell = (rowIdx, direction) => {
            let targetIdx = cellIndex;
            while (true) {
                targetIdx += direction;
                if (
                    targetIdx < 2 || 
                    targetIdx >= table.rows[rowIdx].cells.length
                ) break;
        
                const cell = table.rows[rowIdx].cells[targetIdx];
                if (cell && cell.isContentEditable) return cell;
            }
            return null;
        };
        

        const findVerticalEditableCell = (rowDirection) => {
            let targetRowIdx = rowIndex + rowDirection;
            while (
                targetRowIdx > 0 &&
                targetRowIdx < table.rows.length
            ) {
                const targetCell = table.rows[targetRowIdx].cells[cellIndex];
                if (targetCell && targetCell.isContentEditable && !isSchnitt(targetCell)) {
                    return targetCell;
                }
                targetRowIdx += rowDirection;
            }
            return null;
        };

        let targetCell = null;

        switch (e.key) {
            case 'ArrowUp':
                targetCell = findVerticalEditableCell(-1);
                break;
            case 'ArrowDown':
                targetCell = findVerticalEditableCell(1);
                break;
            case 'ArrowLeft':
                targetCell = findNextEditableCell(rowIndex, -1);
                break;
            case 'ArrowRight':
                targetCell = findNextEditableCell(rowIndex, 1);
                break;
        }

        if (targetCell) {
            e.preventDefault();
            targetCell.focus();
        }
    });
};

const convertNote = (noteStr) => {
    noteStr = noteStr.trim();

    if (/^\d[+-]?$/.test(noteStr)) {
        let base = parseInt(noteStr);
        if (noteStr.endsWith('+')) return base - 0.25;
        if (noteStr.endsWith('-')) return base + 0.25;
        return base;
    }

    if (/^\d-\d$/.test(noteStr)) {
        const parts = noteStr.split('-').map(n => parseInt(n));
        return (parts[0] + parts[1]) / 2;
    }

    return parseFloat(noteStr.replace(',', '.')) || "";
};

window.selectedColumnIndex = null;

const showColumnSelectModal = (callback) => {
    const columnList = document.getElementById('columnList');
    const modal = document.getElementById('columnSelectModal');
    columnList.innerHTML = "";

    const headerRow = document.querySelector('#itemTable tr');
    if (!headerRow) return;

    const columnCounters = {};

    for (let i = 2; i < headerRow.cells.length - 1; i++) {
        const th = headerRow.cells[i];
        const letter = th.dataset.columnLetter;

        if (!letter || letter.includes('schnitt') || letter.toLowerCase().includes('endnote')) continue;

        if (!columnCounters[letter]) columnCounters[letter] = 1;
        else columnCounters[letter]++;

        const label = `${letter}${columnCounters[letter]}`;
        const li = document.createElement('li');
        li.textContent = label;

        li.addEventListener('click', () => {
            selectedColumnIndex = i;
            modal.style.display = 'none';
            callback(i);
        });

        columnList.appendChild(li);
    }

    modal.style.display = 'flex';
};



document.getElementById('imageUpload').addEventListener('change', (e) => {
    showColumnSelectModal(async (columnIndex) => {
        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        if (['txt', 'csv'].includes(ext)) {
            const text = await file.text();
            processNoteData(text, columnIndex);
        } else if (['xls', 'xlsx','docx'].includes(ext)) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const workbook = XLSX.read(ev.target.result, { type: 'binary' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                let text = data.map(row => row.join('\t')).join('\n');
                processNoteData(text, columnIndex);
            };
            reader.readAsBinaryString(file);
        } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
            const image = URL.createObjectURL(file);
            Tesseract.recognize(image, 'deu').then(result => {
                processNoteData(result.data.text, columnIndex);
            });
        }
    });
});

const startCameraInput = () => {
    showColumnSelectModal((columnIndex) => {
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            const video = document.createElement('video');
            video.setAttribute('playsinline', 'true'); // wichtig für mobile Geräte
            video.style.width = '100%';
            video.style.maxWidth = '500px';

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `<div class="modal-content"><h3>Zeige das Blatt mit Namen + Noten</h3></div>`;
            modal.querySelector('.modal-content').appendChild(video);
            document.body.appendChild(modal);

            video.srcObject = stream;
            video.play();

            video.onloadedmetadata = () => {
                // Nach dem Start ein paar Sekunden warten für Scharfstellung
                setTimeout(() => {
                    const canvas = document.getElementById('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    stream.getTracks().forEach(track => track.stop());
                    modal.remove();

                    canvas.toBlob(blob => {
                        Tesseract.recognize(blob, 'deu').then(result => {
                            console.log("Erkannter Text:", result.data.text);
                            processNoteData(result.data.text, columnIndex);
                        }).catch(err => {
                            alert("Fehler beim Erkennen der Noten: " + err.message);
                        });
                    }, 'image/png');
                }, 3000); // 3 Sekunden warten
            };
        }).catch(err => {
            alert("Kamera konnte nicht gestartet werden: " + err.message);
        });
    });
};


const processNoteData = (text, columnIndex) => {
    const lines = text.split('\n');
    const data = dataManager.loadData();
    const cellData = dataManager.loadCellData();

    let updatedData = [...data];
    let updated = false;

    lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) return;

        const name = parts.slice(0, -1).join(' ');
        const noteRaw = parts[parts.length - 1];
        const note = convertNote(noteRaw);
        if (!name || note === "") return;

        let rowIndex = updatedData.indexOf(name);
        if (rowIndex === -1) {
            updatedData.push(name);
            rowIndex = updatedData.length - 1;
            updated = true;
        }

        const actualRowIndex = rowIndex + 1;
        if (!cellData[actualRowIndex]) cellData[actualRowIndex] = {};
        cellData[actualRowIndex][columnIndex] = String(note);
    });

    if (updated) dataManager.saveData(updatedData);
    dataManager.saveCellData(cellData);
    tableManager.renderTable(updatedData);
};

document.getElementById('exportButton').addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Exportformat wählen</h3>
            <button id="exportText" >📄 Text</button>
            <button id="exportExcel" >📊 Excel</button>
            <br><br>
            <button id="cancelExport">Abbrechen</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('exportText').onclick = () => {
        exportAsText();
        modal.remove();
    };

    document.getElementById('exportExcel').onclick = () => {
        exportAsExcel();
        modal.remove();
    };

    document.getElementById('cancelExport').onclick = () => modal.remove();
});

function getExportData() {
    const table = document.getElementById('itemTable');
    const data = [];
    for (let i = 1; i < table.rows.length; i++) {
        const name = table.rows[i].cells[1]?.textContent.trim();
        const note = table.rows[i].cells[table.rows[i].cells.length - 1]?.textContent.trim();
        if (name) {
            data.push({ name, note });
        }
    }
    return data;
}

function exportAsText() {
    const data = getExportData();
    const lines = data.map(entry => `${entry.name}: ${entry.note}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const filename = generateFilename('noten', 'txt');
    triggerDownload(blob, filename);
}

function exportAsExcel() {
    const data = getExportData();
    const rows = [['Schüler', 'Endnote'], ...data.map(d => [d.name, d.note])];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Noten');
    const blob = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const filename = generateFilename('Endnoten', 'xlsx');
    triggerDownload(new Blob([blob], { type: 'application/octet-stream' }), filename);
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function generateFilename(base, extension) {
    const klasse = dataManager.klasse ? dataManager.klasse.replace(/\s+/g, '') : 'Klasse';
    const fach = dataManager.fach ? dataManager.fach.replace(/\s+/g, '') : 'Fach';
    return `${base}_${klasse}_${fach}.${extension}`;
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

document.addEventListener('DOMContentLoaded', () => {
    let pageTitle = document.getElementById('pageTitle');
    if (pageTitle && dataManager.klasse && dataManager.fach) {
        pageTitle.textContent = `Noten in ${decodeURIComponent(dataManager.fach)} in ${decodeURIComponent(dataManager.klasse)}`;
    }
    checkAndSyncData();
    tableManager.renderTable(dataManager.loadData());
            scrollIfNeeded();
});


document.getElementById('backButton').addEventListener('click', event => {
    event.preventDefault();
    history.back();
});

window.addEventListener('pageshow', function (event) {
    if (event.persisted && !sessionStorage.getItem("reloaded")) {
        sessionStorage.setItem("reloaded", "true");
        window.location.reload();
    }
});

const scrollIfNeeded = () => {
    const body = document.body;
    const table = document.getElementById('itemTable');
    if (!table) return;

    const tableBottom = table.getBoundingClientRect().bottom;
    const windowHeight = window.innerHeight;

    if (tableBottom > windowHeight) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else if (body.scrollTop > 0 && tableBottom < windowHeight * 0.9) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};