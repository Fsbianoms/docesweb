document.getElementById('vendaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        cliente: formData.get('cliente'),
        contato: formData.get('contato'),
        produto: formData.get('produto'),
        quantidade: parseInt(formData.get('quantidade')),
        valor: parseFloat(formData.get('valor')),
        status: formData.get('status'),
        data: formData.get('data')
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';

    try {
        const response = await fetch('/api/venda', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Sucesso! Venda registrada na planilha Excel e sistema atualizado.');
            e.target.reset();
            // Definir data de hoje novamente por padrão
            setTodayDate();
        } else {
            alert('❌ Erro: ' + (result.message || result.error));
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('❌ Erro ao conectar com o servidor. Verifique se o servidor API está rodando.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelector('input[name="data"]').value = today;
}

// Iniciar com a data de hoje
setTodayDate();

// Lógica de Sincronização (Sidebar)
const urlInput = document.getElementById('sheetUrlInput');
const savedUrl = localStorage.getItem('sheetUrl');
if (savedUrl && urlInput) urlInput.value = savedUrl;

document.getElementById('syncBtn').addEventListener('click', async () => {
    const btn = document.getElementById('syncBtn');
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
async function loadDatalists() {
    try {
        const response = await fetch('./data.json');
        const sales = await response.json();
        
        const clients = new Set();
        const products = new Set();
        
        sales.forEach(s => {
            if (s.cliente && s.cliente !== "Desconhecido") clients.add(s.cliente);
            if (s.produto && s.produto !== "Desconhecido") products.add(s.produto);
        });

        // Popular clientes
        const clientsDatalist = document.getElementById('clientsList');
        if (clientsDatalist) {
            clientsDatalist.innerHTML = '';
            [...clients].sort().forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                clientsDatalist.appendChild(opt);
            });
        }

        // Popular produtos
        const productsDatalist = document.getElementById('productsList');
        if (productsDatalist) {
            productsDatalist.innerHTML = '';
            [...products].sort().forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                productsDatalist.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar datalists:", e);
    }
}

loadDatalists();
