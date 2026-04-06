// www.kreativekiste.de
// 06.04.2026
// Version 2.6

document.getElementById('btn-clear').addEventListener('click', clearCanvas);

// --- ORDNER STEUERUNG & BOMBENFESTER KONTEXT-MENÜ-FIX ---
document.addEventListener('click', (e) => {
    // Ordner auf/zuklappen
    if (e.target.classList.contains('folder-header')) {
        e.target.parentElement.classList.toggle('open');
    }
    
    // Kontextmenü ausblenden (außer man klickt direkt ins Menü oder startet einen Drag-Vorgang)
    if (!e.target.closest('#context-menu') && !e.target.closest('.edit-comp-btn')) {
        hideContextMenu();
    } else if (e.target.classList.contains('menu-item') || e.target.closest('.menu-item')) {
        // Menü schließen, wenn ein Menüpunkt geklickt wurde
        hideContextMenu();
    }
});

const contextMenu = document.getElementById('context-menu');
contextMenu.style.display = 'none'; // Menü beim Start hart verstecken

function showContextMenu(x, y) {
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.classList.remove('hidden');
    contextMenu.style.display = 'block'; // Menü hart einblenden

    const type = contextMenuTarget ? contextMenuTarget.dataset.type : null;
    
    document.querySelector('.contact-only').style.display = (type === 'schliesser' || type === 'oeffner') ? 'block' : 'none';
    document.querySelector('.power-only').style.display = (type === 'hauptkontakt') ? 'block' : 'none';
    document.querySelector('.assign-only').style.display = (type === 'schuetz' || type === 'schliesser' || type === 'oeffner') ? 'block' : 'none';
    document.querySelector('.motor-only').style.display = (type === 'motor') ? 'block' : 'none';
    document.querySelector('.terminal-only').style.display = (type === 'klemme') ? 'block' : 'none';
    document.querySelector('.lamp-only').style.display = (type === 'lampe') ? 'block' : 'none';
    
    // Zeige das Pfeil-Menü nur bei den Abbruch-Pfeilen an
    document.querySelector('.arrow-only').style.display = (type === 'pfeil_raus' || type === 'pfeil_rein') ? 'block' : 'none';
    
    const isTasterOrSchalter = (type === 'taster' || type === 'schalter');
    document.querySelector('.taster-only').style.display = isTasterOrSchalter ? 'block' : 'none';

    if (isTasterOrSchalter) {
        const prefix = type === 'schalter' ? 'Schalter' : 'Taster';
        document.getElementById('menu-taster-no').innerHTML = `🔘 ${prefix} Schließer`;
        document.getElementById('menu-taster-nc').innerHTML = `🔘 ${prefix} Öffner`;
        document.getElementById('menu-taster-latch-no').innerHTML = `🔒 ${prefix} Schließer rastend`;
        document.getElementById('menu-taster-latch-nc').innerHTML = `🔒 ${prefix} Öffner rastend`;
    }
}

function hideContextMenu() {
    contextMenu.classList.add('hidden');
    contextMenu.style.display = 'none'; 
}

document.getElementById('menu-edit').addEventListener('click', (e) => {
    e.stopPropagation(); hideContextMenu();
    if (contextMenuTarget && typeof openEditorForInstance === 'function') openEditorForInstance(contextMenuTarget);
});

// --- Speichern und Laden ---
document.getElementById('btn-save-project').onclick = () => {
    if(typeof saveCurrentPageState === 'function') saveCurrentPageState();
    const data = { pages: pages, coilCounter: coilCounter };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchor = document.createElement('a'); downloadAnchor.setAttribute("href", dataStr); downloadAnchor.setAttribute("download", "schaltplan_projekt.json"); downloadAnchor.click();
    addHistory('Projekt gespeichert');
};

const fileInput = document.getElementById('file-input');
document.getElementById('btn-load-project').onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = (event) => {
        const data = JSON.parse(event.target.result); pages = data.pages; coilCounter = data.coilCounter || 1; currentPageId = pages[0].id;
        if(typeof loadPageState === 'function') loadPageState(currentPageId); if(typeof renderTabs === 'function') renderTabs();
        addHistory('Projekt geladen');
    };
    reader.readAsText(file);
};

function clearCanvas() {
    canvas.querySelectorAll('.dropped-component').forEach(c => c.remove());
    wiringLayer.innerHTML = ''; connections.length = 0; startPort = null; coilCounter = 1; 
    isAssignMode = false; window.crossPageAssign.active = false; canvas.classList.remove('assign-mode'); selectedParent = null; hideContextMenu();
    if(typeof pages !== 'undefined') { pages = [{ id: 1, name: "Seite 1", components: [], connections: [] }]; currentPageId = 1; if(typeof renderTabs === 'function') renderTabs(); }
    addHistory('Arbeitsfläche komplett geleert');
}

// --- Menü-Aktionen (Zuordnung Normal) ---
document.getElementById('menu-assign').addEventListener('click', (e) => {
    e.stopPropagation(); hideContextMenu();
    if (!contextMenuTarget || contextMenuTarget.dataset.type !== 'schuetz') { alert("Bitte eine Spule (Schütz) auswählen!"); return; }
    isAssignMode = true; selectedParent = contextMenuTarget; canvas.classList.add('assign-mode');
    document.querySelectorAll('.dropped-component').forEach(c => c.classList.remove('parent-selected'));
    selectedParent.classList.add('parent-selected'); addHistory('Zuordnungsmodus aktiv');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        isAssignMode = false; window.crossPageAssign.active = false; selectedParent = null; canvas.classList.remove('assign-mode');
        document.querySelectorAll('.dropped-component').forEach(c => c.classList.remove('parent-selected'));
    }
});

document.getElementById('menu-unassign').addEventListener('click', (e) => {
    e.stopPropagation(); hideContextMenu();
    if(contextMenuTarget && typeof unassignContact === 'function') unassignContact(contextMenuTarget);
});

// --- PFEIL / ABBRUCHSTELLEN STEUERUNG ---
document.getElementById('menu-link-arrow').addEventListener('click', (e) => {
    e.stopPropagation(); hideContextMenu();
    window.crossPageAssign = { active: true, sourceId: contextMenuTarget.dataset.id, sourcePage: currentPageId };
    canvas.classList.add('assign-mode');
    addHistory('Pfeil verlinken: Ziel anklicken (auch auf anderer Seite möglich)');
});

document.getElementById('menu-unlink-arrow').addEventListener('click', (e) => {
    e.stopPropagation(); hideContextMenu();
    if(contextMenuTarget) {
        contextMenuTarget.removeAttribute('data-link-id'); contextMenuTarget.removeAttribute('data-link-page');
        if(typeof updateArrowVisuals === 'function') updateArrowVisuals(contextMenuTarget);
        addHistory('Pfeil-Verlinkung gelöst');
    }
});

document.getElementById('menu-jump-arrow').addEventListener('click', (e) => {
    e.stopPropagation(); hideContextMenu();
    const targetPage = parseInt(contextMenuTarget.dataset.linkPage);
    if (targetPage && targetPage !== currentPageId && typeof switchPage === 'function') {
        switchPage(targetPage);
        addHistory('Zur Ziel-Seite gesprungen');
    } else if (!targetPage) {
        alert("Dieser Pfeil ist noch mit keinem Ziel verlinkt!");
    }
});

// --- Menü-Aktionen (Umbenennen & Löschen & Transform) ---
document.getElementById('menu-rename').addEventListener('click', (e) => {
    e.stopPropagation(); hideContextMenu(); if (!contextMenuTarget) return;
    let newName = prompt("Bauteil umbenennen:", contextMenuTarget.dataset.label || "");
    if (newName !== null) {
        contextMenuTarget.dataset.label = newName; contextMenuTarget.dataset.baseLabel = newName; 
        if(typeof updateLabel === 'function') updateLabel(contextMenuTarget, newName, contextMenuTarget.dataset.type === 'schuetz' ? 'pos-bottom-left' : 'pos-left'); addHistory('Bauteil umbenannt');
    }
});

document.getElementById('menu-delete').addEventListener('click', (e) => {
    e.stopPropagation(); hideContextMenu(); if (!contextMenuTarget) return;
    const id = contextMenuTarget.dataset.id;
    connections = connections.filter(conn => {
        if (conn.port1.closest('.dropped-component') === contextMenuTarget || conn.port2.closest('.dropped-component') === contextMenuTarget) {
            conn.pathElem.remove(); if(conn.h1) conn.h1.remove(); if(conn.h2) conn.h2.remove(); if(conn.h3) conn.h3.remove(); return false;
        } return true;
    });
    if (contextMenuTarget.dataset.type === 'schuetz') { canvas.querySelectorAll(`.dropped-component[data-parent-id="${id}"]`).forEach(c => { if(typeof unassignContact === 'function') unassignContact(c); }); } 
    else { if(typeof unassignContact === 'function') unassignContact(contextMenuTarget); }
    contextMenuTarget.remove(); contextMenuTarget = null; addHistory('Bauteil gelöscht');
});

document.getElementById('menu-rotate').addEventListener('click', (e) => {
    e.stopPropagation(); hideContextMenu();
    if (contextMenuTarget) { let rot = parseInt(contextMenuTarget.dataset.rotation || '0') + 90; if (rot >= 360) rot = 0; contextMenuTarget.dataset.rotation = rot; applyTransform(contextMenuTarget); if(typeof updateCables === 'function') updateCables(); addHistory('Bauteil gedreht'); }
});
document.getElementById('menu-flip').addEventListener('click', (e) => {
    e.stopPropagation(); hideContextMenu();
    if (contextMenuTarget) { contextMenuTarget.dataset.flipX = contextMenuTarget.dataset.flipX === 'true' ? 'false' : 'true'; applyTransform(contextMenuTarget); if(typeof updateCables === 'function') updateCables(); addHistory('Bauteil gespiegelt'); }
});
function applyTransform(el) { const svg = el.querySelector('svg.symbol'); if (!svg) return; const rot = el.dataset.rotation || '0'; const flip = el.dataset.flipX === 'true' ? -1 : 1; svg.style.transform = `rotate(${rot}deg) scaleX(${flip})`; }


// --- TASTER & SCHALTER DYNAMIK FUNKTION ---
function updateTasterVisuals(el) {
    const subtype = el.dataset.subtype || 'no';
    const type = el.dataset.type; 
    const svg = el.querySelector('svg.symbol');
    if (!svg) return;

    let contactHTML = '';
    let actuatorHTML = '';

    if (type === 'schalter') {
        actuatorHTML = '<path d="M 14 50 L 10 50 L 10 60 L 6 60" fill="none" stroke="black" stroke-width="2" />';
    } else {
        actuatorHTML = '<path d="M 15 50 L 10 50 L 10 60 L 15 60" fill="none" stroke="black" stroke-width="2" />';
    }
    
    if (subtype.includes('latch')) {
        actuatorHTML += '<polyline points="20,55 22,59 24,55" fill="none" stroke="black" stroke-width="1.5"/>';
    }

    if (subtype.includes('no')) { 
        contactHTML = `
            <line x1="30" y1="10" x2="30" y2="40" stroke="black" stroke-width="2"/>
            <line x1="22" y1="40" x2="30" y2="70" stroke="black" stroke-width="2"/>
            <line x1="30" y1="70" x2="30" y2="90" stroke="black" stroke-width="2"/>
            <line x1="10" y1="55" x2="26" y2="55" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
        `;
    } else { 
        contactHTML = `
            <line x1="30" y1="10" x2="30" y2="40" stroke="black" stroke-width="2"/>
            <line x1="30" y1="40" x2="39" y2="40" stroke="black" stroke-width="2"/>
            <line x1="36" y1="40" x2="30" y2="70" stroke="black" stroke-width="2"/>
            <line x1="30" y1="70" x2="30" y2="90" stroke="black" stroke-width="2"/>
            <line x1="12" y1="55" x2="33" y2="55" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
        `;
    }

    svg.innerHTML = `
        ${contactHTML}
        ${actuatorHTML}
        <circle cx="30" cy="10" r="4" fill="red" class="port"/>
        <circle cx="30" cy="90" r="4" fill="red" class="port"/>
    `;
    
    svg.querySelectorAll('.port').forEach(p => p.onclick = typeof handlePortClick === 'function' ? handlePortClick : null);
}

// --- Spezial-Kontext-Aktionen ---
['no', 'nc', 'latch-no', 'latch-nc'].forEach(subtype => { 
    const btn = document.getElementById(`menu-taster-${subtype}`);
    if(btn) {
        btn.addEventListener('click', (e) => { 
            e.stopPropagation(); hideContextMenu(); 
            if (contextMenuTarget) { 
                contextMenuTarget.dataset.subtype = subtype; 
                updateTasterVisuals(contextMenuTarget);
                addHistory(contextMenuTarget.dataset.type === 'schalter' ? 'Schalter-Typ geändert' : 'Taster-Typ geändert');
            } 
        }); 
    }
});

[3, 6].forEach(poles => { document.getElementById(`menu-motor-${poles}`).addEventListener('click', (e) => { e.stopPropagation(); hideContextMenu(); if (contextMenuTarget) { contextMenuTarget.dataset.poles = poles; if(typeof updateMotorVisuals === 'function') updateMotorVisuals(contextMenuTarget); } }); });
document.getElementById('menu-terminals-count').addEventListener('click', (e) => { e.stopPropagation(); hideContextMenu(); if (contextMenuTarget) { let count = prompt("Anzahl Klemmen eingeben (1-10):", contextMenuTarget.dataset.terminals || '1'); if (count !== null) { count = Math.max(1, Math.min(10, parseInt(count))); contextMenuTarget.dataset.terminals = count; if(typeof updateTerminalVisuals === 'function') updateTerminalVisuals(contextMenuTarget); } } });
['bulb', 'led', 'blink'].forEach(type => { document.getElementById(`menu-lamp-${type}`).addEventListener('click', (e) => { e.stopPropagation(); hideContextMenu(); if (contextMenuTarget) { contextMenuTarget.dataset.subtype = type; if(typeof updateLampVisuals === 'function') updateLampVisuals(contextMenuTarget); } }); });
['normal', 'timer-on', 'timer-off', 'timer-onoff'].forEach(subtype => { document.getElementById(`menu-type-${subtype}`).addEventListener('click', (e) => { e.stopPropagation(); hideContextMenu(); if (contextMenuTarget) { contextMenuTarget.dataset.subtype = subtype; if(typeof updateContactVisuals === 'function') updateContactVisuals(contextMenuTarget); const parentId = contextMenuTarget.getAttribute('data-parent-id'); if (parentId) { if(typeof recalculateTerminals === 'function') recalculateTerminals(parentId); if(typeof updateCoilVisuals === 'function') updateCoilVisuals(parentId); } } }); });
[1, 2, 3].forEach(poles => { document.getElementById(`menu-power-${poles}`).addEventListener('click', (e) => { e.stopPropagation(); hideContextMenu(); if (contextMenuTarget) { contextMenuTarget.dataset.poles = poles; if(typeof updatePowerContactVisuals === 'function') updatePowerContactVisuals(contextMenuTarget); } }); });


// --- NEU: RASTER & ZOOM STEUERUNG ---
let gridVisible = true;
document.getElementById('btn-toggle-grid').addEventListener('click', () => {
    gridVisible = !gridVisible;
    document.getElementById('area-4').style.backgroundImage = gridVisible ? 'radial-gradient(#bdc3c7 1px, transparent 1px)' : 'none';
    addHistory('Raster ' + (gridVisible ? 'eingeschaltet' : 'ausgeschaltet'));
});

window.currentZoom = 1.0;
const canvasArea = document.getElementById('area-4');
const zoomLevelText = document.getElementById('zoom-level');

document.getElementById('btn-zoom-in').addEventListener('click', () => {
    if (window.currentZoom < 2.0) {
        window.currentZoom += 0.1;
        applyZoom();
    }
});

document.getElementById('btn-zoom-out').addEventListener('click', () => {
    if (window.currentZoom > 0.4) {
        window.currentZoom -= 0.1;
        applyZoom();
    }
});

function applyZoom() {
    // Rundung, damit wir saubere Prozentzahlen haben
    zoomLevelText.innerText = Math.round(window.currentZoom * 100) + '%';
    // Der CSS zoom Befehl skaliert die gesamte Zeichenfläche nativ!
    canvasArea.style.zoom = window.currentZoom;
    addHistory('Zoom auf ' + zoomLevelText.innerText);
}
