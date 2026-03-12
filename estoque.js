// Lógica de Sincronização (Sidebar)
const urlInput = document.getElementById('sheetUrlInput');
const savedUrl = localStorage.getItem('sheetUrl');
if (savedUrl && urlInput) urlInput.value = savedUrl;

document.getElementById('syncBtn').addEventListener('click', async () => {
    const btn = document.getElementById('syncBtn');
    if (!btn) return;
    const url = document.getElementById('sheetUrlInput')?.value;
    
    if (url) {
        localStorage.setItem('sheetUrl', url);
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';

    try {
        const response = await fetch('/api/sync', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });
        const result = await response.json();
        if (result.success) {
            alert('✅ ' + result.message);
            location.reload();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        alert('❌ Erro de conexão.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
});
