// www.kreativekiste.de // 05.04.2026 // Version 1.6

const pageTabsContainer = document.getElementById('page-tabs');

function initPages() { renderTabs(); }

function renderTabs() {
    pageTabsContainer.innerHTML = '';
    pages.forEach(page => {
        const tab = document.createElement('div');
        tab.className = `page-tab ${page.id === currentPageId ? 'active' : ''}`;
        tab.textContent = page.name;
        tab.onclick = () => switchPage(page.id);
        pageTabsContainer.appendChild(tab);
    });
}

function addPage() {
    saveCurrentPageState();
    const newId = pages.length > 0 ? Math.max(...pages.map(p => p.id)) + 1 : 1;
    pages.push({ id: newId, name: "Seite " + newId, components: [], connections: [] });
    switchPage(newId);
    addHistory('Neue Seite erstellt');
}

function saveCurrentPageState() {
    const currentPage = pages.find(p => p.id === currentPageId);
    if (!currentPage) return;

    const comps = [];
    canvas.querySelectorAll('.dropped-component').forEach(el => {
        comps.push({
            id: el.dataset.id, type: el.dataset.type, label: el.dataset.label,
            baseLabel: el.dataset.baseLabel, subtype: el.dataset.subtype,
            poles: el.dataset.poles, hubbel: el.dataset.hubbel, 
            terminals: el.dataset.terminals, parentId: el.dataset.parentId, 
            
            // NEU: Für Pfeilverlinkungen abspeichern
            linkId: el.dataset.linkId, linkPage: el.dataset.linkPage, 
            
            html: el.innerHTML, left: el.style.left, top: el.style.top,
            rotation: el.dataset.rotation, flipX: el.dataset.flipX
        });
    });
    currentPage.components = comps;
    
    const conns = connections.map(c => ({
        port1Id: c.port1.closest('.dropped-component').dataset.id,
        port1Index: Array.from(c.port1.closest('.dropped-component').querySelectorAll('.port')).indexOf(c.port1),
        port2Id: c.port2.closest('.dropped-component').dataset.id,
        port2Index: Array.from(c.port2.closest('.dropped-component').querySelectorAll('.port')).indexOf(c.port2),
        customX1: c.customX1, customY: c.customY, customX2: c.customX2
    }));
    currentPage.connections = conns;
}

function switchPage(id) {
    saveCurrentPageState(); currentPageId = id; loadPageState(id); renderTabs();
}

function loadPageState(id) {
    const page = pages.find(p => p.id === id);
    if (!page) return;

    canvas.querySelectorAll('.dropped-component').forEach(c => c.remove());
    wiringLayer.innerHTML = ''; connections = [];

    page.components.forEach(c => {
        const div = document.createElement('div');
        div.className = 'dropped-component'; div.style.left = c.left; div.style.top = c.top;
        div.dataset.id = c.id; div.dataset.type = c.type;
        if(c.label) div.dataset.label = c.label;
        if(c.baseLabel) div.dataset.baseLabel = c.baseLabel;
        if(c.subtype) div.dataset.subtype = c.subtype;
        if(c.poles) div.dataset.poles = c.poles;
        if(c.hubbel) div.dataset.hubbel = c.hubbel;
        if(c.terminals) div.dataset.terminals = c.terminals;
        if(c.parentId) div.dataset.parentId = c.parentId;
        
        // NEU: Pfeilverlinkungen laden
        if(c.linkId) div.dataset.linkId = c.linkId;
        if(c.linkPage) div.dataset.linkPage = c.linkPage;

        if(c.rotation) div.dataset.rotation = c.rotation;
        if(c.flipX) div.dataset.flipX = c.flipX;
        div.innerHTML = c.html;

        // Wenn es ein Pfeil ist, zeige sofort das Label an
        if (c.type === 'pfeil_raus' || c.type === 'pfeil_rein') {
            if (typeof updateArrowVisuals === 'function') updateArrowVisuals(div);
        }

        div.addEventListener('mousedown', typeof startMovingComponent === 'function' ? startMovingComponent : null);
        div.addEventListener('click', typeof handleComponentClick === 'function' ? handleComponentClick : null);
        div.addEventListener('dblclick', (e) => {
            if ((typeof isAssignMode !== 'undefined' && isAssignMode) || (window.crossPageAssign && window.crossPageAssign.active)) return;
            contextMenuTarget = div;
            if(typeof showContextMenu === 'function') showContextMenu(e.clientX, e.clientY);
        });
        div.querySelectorAll('.port').forEach(p => p.onclick = typeof handlePortClick === 'function' ? handlePortClick : null);
        canvas.appendChild(div);
    });

    page.connections.forEach(conn => {
        const comp1 = canvas.querySelector(`[data-id="${conn.port1Id}"]`);
        const comp2 = canvas.querySelector(`[data-id="${conn.port2Id}"]`);
        if (comp1 && comp2) {
            const port1 = comp1.querySelectorAll('.port')[conn.port1Index];
            const port2 = comp2.querySelectorAll('.port')[conn.port2Index];
            if(typeof window.addConnection === 'function') {
                window.addConnection(port1, port2, { customX1: conn.customX1, customY: conn.customY, customX2: conn.customX2 });
            }
        }
    });

    if(typeof updateCables === 'function') updateCables();

    // WICHTIG: Wenn man beim Seitenwechseln im "Pfeil-Verlinken"-Modus war, bleibt das Fadenkreuz an!
    if (window.crossPageAssign && window.crossPageAssign.active) {
        canvas.classList.add('assign-mode');
    }
}

document.getElementById('btn-add-page').onclick = addPage;
initPages();