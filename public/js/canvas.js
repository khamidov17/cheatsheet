// Canvas zoom/pan — only activates if zoom controls exist in the DOM
document.addEventListener('DOMContentLoaded', () => {
    const canvasContainer = document.getElementById('canvas-container');
    const mainCanvas = document.getElementById('main-canvas');
    if (!canvasContainer || !mainCanvas) return;

    // Zoom (optional controls — not currently in toolbar but kept for future use)
    let currentZoom = 1;
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomLevelTxt = document.getElementById('zoom-level');

    function updateZoom() {
        mainCanvas.style.transform = `scale(${currentZoom})`;
        mainCanvas.style.transformOrigin = 'top center';
        if (zoomLevelTxt) zoomLevelTxt.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (currentZoom < 2.5) { currentZoom += 0.1; updateZoom(); }
        });
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (currentZoom > 0.3) { currentZoom -= 0.1; updateZoom(); }
        });
    }

    // Ctrl/Cmd + scroll to zoom
    canvasContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY > 0) { if (currentZoom > 0.3) currentZoom -= 0.05; }
            else { if (currentZoom < 2.5) currentZoom += 0.05; }
            updateZoom();
        }
    }, { passive: false });

    // Drag to pan (only when clicking the dark background, not the canvas content)
    let isPanning = false;
    let startX, startY, scrollLeft, scrollTop;

    canvasContainer.addEventListener('mousedown', (e) => {
        if (e.target === canvasContainer) {
            isPanning = true;
            startX = e.pageX - canvasContainer.offsetLeft;
            startY = e.pageY - canvasContainer.offsetTop;
            scrollLeft = canvasContainer.scrollLeft;
            scrollTop = canvasContainer.scrollTop;
            canvasContainer.style.cursor = 'grabbing';
        }
    });

    canvasContainer.addEventListener('mouseleave', () => { isPanning = false; canvasContainer.style.cursor = 'grab'; });
    canvasContainer.addEventListener('mouseup', () => { isPanning = false; canvasContainer.style.cursor = 'grab'; });

    canvasContainer.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const x = e.pageX - canvasContainer.offsetLeft;
        const y = e.pageY - canvasContainer.offsetTop;
        canvasContainer.scrollLeft = scrollLeft - (x - startX) * 1.5;
        canvasContainer.scrollTop = scrollTop - (y - startY) * 1.5;
    });
});
