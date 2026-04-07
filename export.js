// www.kreativekiste.de // 07.04.2026 // Export Modul

document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('btn-export');
    const canvasArea = document.getElementById('area-4');

    if (exportBtn && canvasArea) {
        exportBtn.addEventListener('click', () => {
            
            // Optional: Wenn du das Raster beim Export ausblenden willst, 
            // könnten wir es hier kurz abschalten und danach wieder anmachen.
            // Für den Anfang exportieren wir es genau so, wie man es sieht.
            
            // Ändere den Button-Text kurz als visuelles Feedback
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = '⏳ Exportiere...';
            exportBtn.disabled = true;

            // html2canvas fotografiert den Bereich
            html2canvas(canvasArea, {
                backgroundColor: '#ffffff', // Weißer Hintergrund
                scale: 2 // Skalierung für eine bessere Bildauflösung
            }).then(canvas => {
                // Erstelle einen virtuellen Link zum Herunterladen
                const link = document.createElement('a');
                link.download = 'Schaltplan_Export.png'; // Dateiname
                link.href = canvas.toDataURL('image/png');
                
                // Klick simulieren
                link.click();

                // Button wieder zurücksetzen
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;

                // Historie updaten, falls die Funktion existiert
                if (typeof addHistory === 'function') {
                    addHistory('Schaltplan als PNG exportiert');
                }
            }).catch(err => {
                console.error('Fehler beim Export:', err);
                alert('Beim Exportieren ist leider ein Fehler aufgetreten.');
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
            });
        });
    }
});