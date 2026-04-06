// www.kreativekiste.de // 06.04.2026 // Version 2.10

// --- CAD-TRICK: Macht auch leere Rechtecke und Kreise in der Mitte anklickbar! ---
const editorStyle = document.createElement('style');
editorStyle.innerHTML = `#editor-canvas * { pointer-events: all !important; }`;
document.head.appendChild(editorStyle);

const modal = document.getElementById('editor-modal');
const editorCanvas = document.getElementById('editor-canvas');
const toolBtns = document.querySelectorAll('.editor-btn');

let currentTool = 'line';
let isDrawing = false;
let startX, startY;
let currentElement = null;

let editingComponent = null; 
let editingInstance = null;  

let selectedEditorElement = null;
let editorHandles = [];
let activeDragHandle = null;

// Öffnet den Editor für ein leeres, neues Bauteil
document.getElementById('btn-new-comp').addEventListener('click', () => {
    editingComponent = null;
    editingInstance = null;
    editorCanvas.innerHTML = ''; 
    deselectElement();
    modal.classList.remove('hidden');
});

document.getElementById('btn-close-editor').addEventListener('click', () => {
    deselectElement();
    modal.classList.add('hidden');
});

toolBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        toolBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentTool = e.currentTarget.dataset.tool;
        deselectElement();
    });
});

function getMouseCoords(e) {
    const rect = editorCanvas.getBoundingClientRect();
    return {
        x: Math.round((e.clientX - rect.left) / (rect.width / 60)),
        y: Math.round((e.clientY - rect.top) / (rect.height / 100))
    };
}

// --- ZEICHNEN & AUSWÄHLEN ---
editorCanvas.addEventListener('mousedown', (e) => {
    if (currentTool === 'select') {
        // Solange man nicht den leeren Canvas anklickt, wähle das Element
        if (e.target !== editorCanvas && e.target.tagName.toLowerCase() !== 'svg') {
            selectElement(e.target);
            const coords = getMouseCoords(e);
            setupElementMove(e.target, coords); 
        } else {
            deselectElement();
        }
        return;
    }

    deselectElement();
    isDrawing = true;
    const coords = getMouseCoords(e);
    startX = coords.x; startY = coords.y;

    if (currentTool === 'line') {
        currentElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        currentElement.setAttribute('x1', startX); currentElement.setAttribute('y1', startY);
        currentElement.setAttribute('x2', startX); currentElement.setAttribute('y2', startY);
        currentElement.setAttribute('stroke', 'black'); currentElement.setAttribute('stroke-width', '2');
    } else if (currentTool === 'rect') {
        currentElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        currentElement.setAttribute('x', startX); currentElement.setAttribute('y', startY);
        currentElement.setAttribute('width', '0'); currentElement.setAttribute('height', '0');
        currentElement.setAttribute('fill', 'none'); currentElement.setAttribute('stroke', 'black'); currentElement.setAttribute('stroke-width', '2');
    } else if (currentTool === 'circle') {
        currentElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        currentElement.setAttribute('cx', startX); currentElement.setAttribute('cy', startY);
        currentElement.setAttribute('r', '0');
        currentElement.setAttribute('fill', 'none'); currentElement.setAttribute('stroke', 'black'); currentElement.setAttribute('stroke-width', '2');
    } else if (currentTool === 'port') {
        currentElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        currentElement.setAttribute('cx', startX); currentElement.setAttribute('cy', startY);
        currentElement.setAttribute('r', '4');
        currentElement.setAttribute('fill', 'red'); currentElement.setAttribute('class', 'port');
        editorCanvas.appendChild(currentElement);
        isDrawing = false; return;
    } else if (currentTool === 'text') {
        const txt = prompt("Text eingeben:");
        if (txt) {
            currentElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            currentElement.setAttribute('x', startX); currentElement.setAttribute('y', startY);
            currentElement.setAttribute('font-size', '10'); currentElement.setAttribute('font-family', 'Arial');
            currentElement.style.userSelect = 'none';
            currentElement.textContent = txt;
            editorCanvas.appendChild(currentElement);
        }
        isDrawing = false; return;
    }
    
    if (currentElement) editorCanvas.appendChild(currentElement);
});

// --- MAUSBEWEGUNG ---
document.addEventListener('mousemove', (e) => {
    if (modal.classList.contains('hidden')) return;

    const coords = getMouseCoords(e);
    
    // 1. Wenn wir ein Bauteil oder Anfasser frei bewegen
    if (activeDragHandle) {
        activeDragHandle(coords.x, coords.y);
        return;
    }

    // 2. Wenn wir gerade live zeichnen
    if (isDrawing && currentElement) {
        if (currentTool === 'line') {
            currentElement.setAttribute('x2', coords.x); currentElement.setAttribute('y2', coords.y);
        } else if (currentTool === 'rect') {
            const width = coords.x - startX; const height = coords.y - startY;
            currentElement.setAttribute('x', width < 0 ? coords.x : startX);
            currentElement.setAttribute('y', height < 0 ? coords.y : startY);
            currentElement.setAttribute('width', Math.abs(width));
            currentElement.setAttribute('height', Math.abs(height));
        } else if (currentTool === 'circle') {
            const r = Math.sqrt(Math.pow(coords.x - startX, 2) + Math.pow(coords.y - startY, 2));
            currentElement.setAttribute('r', r);
        }
    }
});

// --- MAUS LOSLASSEN ---
document.addEventListener('mouseup', () => { 
    isDrawing = false; 
    currentElement = null; 
    activeDragHandle = null; 
});

// --- LÖSCHEN LOGIK ---
document.getElementById('btn-delete-element').addEventListener('click', () => {
    if (selectedEditorElement) { selectedEditorElement.remove(); deselectElement(); }
});

document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && !modal.classList.contains('hidden') && selectedEditorElement) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            selectedEditorElement.remove(); 
            deselectElement();
        }
    }
});

// --- AUSWÄHLEN UND MARKIEREN ---
function deselectElement() {
    if (selectedEditorElement) {
        selectedEditorElement.removeAttribute('stroke-dasharray');
        selectedEditorElement.removeAttribute('opacity'); 
    }
    selectedEditorElement = null;
    editorHandles.forEach(h => h.remove());
    editorHandles = [];
}

function selectElement(el) {
    deselectElement();
    selectedEditorElement = el;
    el.setAttribute('opacity', '0.4'); 
    
    const tag = el.tagName.toLowerCase();
    if (tag !== 'circle' && tag !== 'text' && tag !== 'path' && tag !== 'g') {
        el.setAttribute('stroke-dasharray', '2,2');
    }
    renderHandles();
}

function renderHandles() {
    editorHandles.forEach(h => h.remove());
    editorHandles = [];
    const el = selectedEditorElement;
    if (!el) return;

    const tag = el.tagName.toLowerCase();
    
    if (tag === 'line') {
        createHandle(parseFloat(el.getAttribute('x1'))||0, parseFloat(el.getAttribute('y1'))||0, (nx, ny) => { el.setAttribute('x1', nx); el.setAttribute('y1', ny); renderHandles(); });
        createHandle(parseFloat(el.getAttribute('x2'))||0, parseFloat(el.getAttribute('y2'))||0, (nx, ny) => { el.setAttribute('x2', nx); el.setAttribute('y2', ny); renderHandles(); });
    } 
    else if (tag === 'rect') {
        const x = parseFloat(el.getAttribute('x')) || 0; const y = parseFloat(el.getAttribute('y')) || 0;
        const w = parseFloat(el.getAttribute('width')) || 0; const h = parseFloat(el.getAttribute('height')) || 0;
        createHandle(x, y, (nx, ny) => {
            el.setAttribute('x', nx); el.setAttribute('y', ny);
            el.setAttribute('width', Math.max(1, w + (x - nx))); el.setAttribute('height', Math.max(1, h + (y - ny))); renderHandles();
        });
        createHandle(x + w, y + h, (nx, ny) => {
            el.setAttribute('width', Math.max(1, nx - x)); el.setAttribute('height', Math.max(1, ny - y)); renderHandles();
        });
    } 
    else if (tag === 'circle') {
        const cx = parseFloat(el.getAttribute('cx')) || 0; const cy = parseFloat(el.getAttribute('cy')) || 0;
        if (!el.classList.contains('port')) {
            const r = parseFloat(el.getAttribute('r')) || 0;
            createHandle(cx + r, cy, (nx, ny) => { el.setAttribute('r', Math.max(1, Math.abs(nx - cx))); renderHandles(); }); 
        }
    } 
}

function createHandle(x, y, onDrag) {
    const h = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    h.setAttribute('cx', x); h.setAttribute('cy', y); h.setAttribute('r', '3');
    h.setAttribute('fill', '#e74c3c'); h.setAttribute('stroke', '#fff'); h.setAttribute('stroke-width', '1');
    h.style.cursor = 'move';
    h.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (currentTool !== 'select') return;
        activeDragHandle = onDrag;
    });
    editorCanvas.appendChild(h);
    editorHandles.push(h);
}

// --- JEDES ELEMENT FREI VERSCHIEBEN ---
function setupElementMove(el, startCoords) {
    const tag = el.tagName.toLowerCase();
    let initData = {};
    
    if (tag === 'line') {
        initData = { x1: parseFloat(el.getAttribute('x1'))||0, y1: parseFloat(el.getAttribute('y1'))||0, x2: parseFloat(el.getAttribute('x2'))||0, y2: parseFloat(el.getAttribute('y2'))||0 };
    } else if (tag === 'rect' || tag === 'text') {
        initData = { x: parseFloat(el.getAttribute('x'))||0, y: parseFloat(el.getAttribute('y'))||0 };
    } else if (tag === 'circle') {
        initData = { cx: parseFloat(el.getAttribute('cx'))||0, cy: parseFloat(el.getAttribute('cy'))||0 };
    } else {
        // Fallback für komplexe SVG Pfade (z.B. wenn man existierende Bauteile öffnet)
        const transform = el.getAttribute('transform') || '';
        const match = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
        initData = { 
            tx: match ? parseFloat(match[1]) : 0, 
            ty: match ? parseFloat(match[2]) : 0, 
            originalTransform: transform.replace(/translate\([-\d.]+,\s*[-\d.]+\)/g, '').trim() 
        };
    }

    activeDragHandle = (nx, ny) => {
        const dx = nx - startCoords.x;
        const dy = ny - startCoords.y;
        
        if (tag === 'line') {
            el.setAttribute('x1', initData.x1 + dx); el.setAttribute('y1', initData.y1 + dy);
            el.setAttribute('x2', initData.x2 + dx); el.setAttribute('y2', initData.y2 + dy);
        } else if (tag === 'rect' || tag === 'text') {
            el.setAttribute('x', initData.x + dx); el.setAttribute('y', initData.y + dy);
        } else if (tag === 'circle') {
            el.setAttribute('cx', initData.cx + dx); el.setAttribute('cy', initData.cy + dy);
        } else {
            el.setAttribute('transform', `translate(${initData.tx + dx}, ${initData.ty + dy}) ${initData.originalTransform}`.trim());
        }
        renderHandles();
    };
}

// --- SPEICHERN ---
document.getElementById('btn-save-comp').addEventListener('click', () => {
    deselectElement(); 
    
    if (editingInstance) {
        editingInstance.querySelector('svg.symbol').innerHTML = editorCanvas.innerHTML;
        if(typeof updateCables === 'function') updateCables();
        addHistory('Bauteil auf Plan geändert');
    } else if (editingComponent) {
        editingComponent.querySelector('svg.symbol').innerHTML = editorCanvas.innerHTML;
        addHistory('Vorlage geändert');
    } else {
        const newDiv = document.createElement('div');
        newDiv.className = 'component-item';
        newDiv.draggable = true;
        newDiv.dataset.type = 'custom';
        newDiv.innerHTML = `<button class="edit-comp-btn" title="Bauteil bearbeiten">✏️</button><svg viewBox="0 0 60 100" width="60" height="100" class="symbol">${editorCanvas.innerHTML}</svg>`;
        
        // --- DER WICHTIGE FIX FÜR DAS DRAG & DROP DES NEUEN BAUTEILS ---
        newDiv.addEventListener('dragstart', (e) => {
            draggedHTML = e.currentTarget.querySelector('svg').outerHTML;
            draggedType = 'custom'; // <-- Das hat gefehlt!
            e.dataTransfer.setData('text/plain', ''); 
        });
        
        newDiv.querySelector('.edit-comp-btn').addEventListener('click', openEditorForComponent);
        document.getElementById('area-3').appendChild(newDiv);
        addHistory('Neues Bauteil erstellt');
    }
    modal.classList.add('hidden');
});

function openEditorForComponent(e) {
    editingComponent = e.currentTarget.closest('.component-item');
    editingInstance = null; 
    editorCanvas.innerHTML = editingComponent.querySelector('svg.symbol').innerHTML;
    modal.classList.remove('hidden');
}

window.openEditorForInstance = function(el) {
    editingComponent = null; 
    editingInstance = el;
    editorCanvas.innerHTML = el.querySelector('svg.symbol').innerHTML;
    modal.classList.remove('hidden');
}

document.querySelectorAll('.edit-comp-btn').forEach(btn => {
    btn.addEventListener('click', openEditorForComponent);
    btn.addEventListener('mousedown', e => e.stopPropagation());
});
