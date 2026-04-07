// www.kreativekiste.de // 07.04.2026 // Version 1.5

function drawFrame() {
    const area4 = document.getElementById('area-4');
    const wiringLayer = document.getElementById('wiring-layer');
    if (!area4 || !wiringLayer) return;

    const existingFrame = document.getElementById('drawing-frame');
    if (existingFrame) existingFrame.remove();

    const w = 1123, h = 794, m = 10;
    const th = 25, lw = 25, bh = 60;
    const cw = w - 2 * m, ch = h - 2 * m;

    let svgStr = `<svg id="drawing-frame" width="100%" height="100%" viewBox="0 0 ${w} ${h}" style="position:absolute; top:0; left:0; z-index:0;">`;

    // Rahmen und Linien
    svgStr += `<rect x="${m}" y="${m}" width="${cw}" height="${ch}" fill="none" stroke="black" stroke-width="2" style="pointer-events:none;"/>`;

    // --- OBERE LEISTE (1-17) ---
    const cols = 17;
    const colW = (cw - lw) / cols;
    for (let i = 0; i < cols; i++) {
        const x = m + lw + (i * colW);
        if (i > 0) svgStr += `<line x1="${x}" y1="${m}" x2="${x}" y2="${m + th}" stroke="black" stroke-width="1" style="pointer-events:none;"/>`;
        svgStr += `<text x="${x + colW / 2}" y="${m + th / 2}" dy="0.3em" text-anchor="middle" font-family="Arial" font-size="13" fill="black" style="pointer-events:none;">${i + 1}</text>`;
    }
    svgStr += `<line x1="${m + lw}" y1="${m + th}" x2="${m + cw}" y2="${m + th}" stroke="black" stroke-width="2" style="pointer-events:none;"/>`;

    // --- LINKE LEISTE (A-H) ---
    const rows = 8;
    const rowH = (ch - th - bh) / rows;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (let i = 0; i < rows; i++) {
        const y = m + th + (i * rowH);
        if (i > 0) svgStr += `<line x1="${m}" y1="${y}" x2="${m + lw}" y2="${y}" stroke="black" stroke-width="1" style="pointer-events:none;"/>`;
        svgStr += `<text x="${m + lw / 2}" y="${y + rowH / 2}" dy="0.3em" text-anchor="middle" font-family="Arial" font-size="13" fill="black" style="pointer-events:none;">${letters[i]}</text>`;
    }
    const footerY = m + ch - bh;
    svgStr += `<line x1="${m + lw}" y1="${m}" x2="${m + lw}" y2="${footerY}" stroke="black" stroke-width="2" style="pointer-events:none;"/>`;

    // --- SCHRIFTFELD UNTEN ---
    svgStr += `<line x1="${m}" y1="${footerY}" x2="${m + cw}" y2="${footerY}" stroke="black" stroke-width="2" style="pointer-events:none;"/>`;
    const footerMidY = footerY + bh / 2;
    const fsW = 250; 

    svgStr += `<line x1="${m + fsW}" y1="${footerY}" x2="${m + fsW}" y2="${m + ch}" stroke="black" stroke-width="1" style="pointer-events:none;"/>`;
    svgStr += `<line x1="${m + cw - fsW}" y1="${footerY}" x2="${m + cw - fsW}" y2="${m + ch}" stroke="black" stroke-width="1" style="pointer-events:none;"/>`;
    svgStr += `<line x1="${m}" y1="${footerMidY}" x2="${m + fsW}" y2="${footerMidY}" stroke="black" stroke-width="1" style="pointer-events:none;"/>`;
    svgStr += `<line x1="${m + cw - fsW}" y1="${footerMidY}" x2="${m + cw}" y2="${footerMidY}" stroke="black" stroke-width="1" style="pointer-events:none;"/>`;

    // --- INTERAKTIVE TEXTE ---
    // Funktion zum Erstellen editierbarer Texte
    const createEditableText = (x, y, id, defaultStr, size, anchor = "start", weight = "normal") => {
        // Wir speichern den Text in einem globalen Objekt, damit er beim Neuzeichnen erhalten bleibt
        if (!window.frameData) window.frameData = {};
        const content = window.frameData[id] || defaultStr;
        
        return `<text class="editable-frame-text" data-id="${id}" x="${x}" y="${y}" dy="0.3em" text-anchor="${anchor}" font-family="Arial" font-size="${size}" font-weight="${weight}" fill="black" style="cursor:pointer; pointer-events:all;">${content}</text>`;
    };

    svgStr += createEditableText(m + 10, footerY + bh / 4, "autor", "Bearbeiter: Kreative Kiste", 12);
    svgStr += createEditableText(m + 10, footerMidY + bh / 4, "datum", "Datum: " + new Date().toLocaleDateString('de-DE'), 12);
    
    const midBlockCenter = m + fsW + ((cw - 2 * fsW) / 2);
    svgStr += createEditableText(midBlockCenter, footerY + bh / 2, "titel", "Schaltplan Anlage 1", 20, "middle", "bold");

    svgStr += createEditableText(m + cw - fsW + 10, footerY + bh / 4, "projekt", "Projekt: Hauptverteilung", 12);
    
    // Seite bleibt statisch (wird später über die Seitenlogik gesteuert)
    svgStr += `<text x="${m + cw - fsW + 10}" y="${footerMidY + bh / 4}" dy="0.3em" font-family="Arial" font-size="12" fill="black" style="pointer-events:none;">Seite: ${typeof currentPageId !== 'undefined' ? currentPageId : 1} / ${typeof pages !== 'undefined' ? pages.length : 1}</text>`;

    svgStr += `</svg>`;

    area4.insertAdjacentHTML('afterbegin', svgStr);

    // Event-Listener für Doppelklick hinzufügen
    const frame = document.getElementById('drawing-frame');
    frame.querySelectorAll('.editable-frame-text').forEach(textNode => {
        textNode.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const id = textNode.dataset.id;
            const currentVal = textNode.textContent;
            const newVal = prompt("Text ändern:", currentVal);
            if (newVal !== null) {
                if (!window.frameData) window.frameData = {};
                window.frameData[id] = newVal;
                drawFrame(); // Neu zeichnen, um Änderungen anzuzeigen
            }
        });
    });
}

// Initialisierung
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drawFrame);
} else {
    drawFrame();
}