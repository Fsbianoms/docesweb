let allClients = [];

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Formatar data
const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "nan") return "-";
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return new Intl.DateTimeFormat('pt-BR').format(date);
};

// Gera as iniciais para o avatar
const getInitials = (name) => {
    if (!name || name === "Desconhecido") return "?";
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

let rawSalesData = [];

async function loadClientes() {
    try {
        const response = await fetch('./data.json');
        rawSalesData = await response.json();
        
        // Inicializa com "Todos"
        processCrmData(rawSalesData);

        // Barra de pesquisa
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allClients.filter(c => c.nome.toLowerCase().includes(searchTerm));
            renderCrmGrid(filtered);
        });

        // Filtro de mês
        document.getElementById('monthSelect').addEventListener('change', (e) => {
            const month = e.target.value;
            let filtered = rawSalesData;
            if (month !== 'Todos') {
                filtered = rawSalesData.filter(s => s.mes.includes(month));
            }
            processCrmData(filtered);
        });

    } catch (error) {
        console.error("Erro ao carregar dados pro CRM:", error);
    }
}

function processCrmData(sales) {
    const clientMap = {};

    let totalRevenueGlobal = 0;

    sales.forEach(sale => {
        if (!sale.cliente || sale.cliente === "Desconhecido") return;

        if (!clientMap[sale.cliente]) {
            clientMap[sale.cliente] = {
                nome: sale.cliente,
                totalGasto: 0,
                totalPendente: 0,
                compras: 0,
                produtos: {},
                historico: []
            };
        }

        const client = clientMap[sale.cliente];
        
        // Adicionar ao histórico
        client.historico.push({
            data: sale.data,
            produto: sale.produto,
            quantidade: sale.quantidade,
            valor: sale.valor,
            status: sale.status
        });
        
        if (sale.status === 'PAGO') {
            client.totalGasto += sale.valor;
            totalRevenueGlobal += sale.valor;
        } else {
            client.totalPendente += sale.valor;
        }

        client.compras += 1;

        if (sale.produto !== "Desconhecido") {
            if (!client.produtos[sale.produto]) client.produtos[sale.produto] = 0;
            client.produtos[sale.produto] += sale.quantidade;
        }
    });

    allClients = Object.values(clientMap).map(client => {
        // Encontrar produto favorito
        let favorite = "Nenhum";
        let maxQ = 0;
        for (const [prod, qtd] of Object.entries(client.produtos)) {
            if (qtd > maxQ) {
                maxQ = qtd;
                favorite = prod;
            }
        }
        client.produtoFavorito = favorite;
        return client;
    });

    // Ordenar clientes por quem deve mais, seguido por quem gastou mais
    allClients.sort((a, b) => b.totalPendente - a.totalPendente || b.totalGasto - a.totalGasto);

    // Atualizar Top Metrics
    const debtors = allClients.filter(c => c.totalPendente > 0).length;
    const avgTicket = allClients.length > 0 ? totalRevenueGlobal / allClients.length : 0;

    document.getElementById('totalClients').innerText = allClients.length;
    document.getElementById('clientsWithDebt').innerText = debtors;
    document.getElementById('averageTicket').innerText = formatCurrency(avgTicket);

    renderCrmGrid(allClients);

    // Popular o datalist de busca com os nomes dos clientes
    const dataList = document.getElementById('searchClientsList');
    if (dataList) {
        dataList.innerHTML = '';
        allClients.forEach(c => {
            const option = document.createElement('option');
            option.value = c.nome;
            dataList.appendChild(option);
        });
    }
}

function renderCrmGrid(clients) {
    const grid = document.getElementById('crmGrid');
    grid.innerHTML = '';

    clients.forEach(client => {
        const debtAlert = client.totalPendente > 0 ? `style="color: var(--warning);"` : '';
        const debtText = client.totalPendente > 0 ? formatCurrency(client.totalPendente) : 'Quitado';

        // Whats message pre-formatted for debt collection or promo
        let waMsg = '';
        if (client.totalPendente > 0) {
            waMsg = `Olá ${client.nome}, tudo bem? Passando para lembrar do seu docinho! Consta aqui um valor pendente de ${formatCurrency(client.totalPendente)} referentes às suas últimas compras de doces. Podemos acertar? 🍬`;
        } else {
            waMsg = `Olá ${client.nome}! Percebi que seu doce favorito é o ${client.produtoFavorito}. Temos novidades na doceria, venha conferir! 🎂`;
        }

        const encodedMsg = encodeURIComponent(waMsg);
        
        const card = document.createElement('div');
        card.className = 'client-card';
        card.innerHTML = `
            <div class="client-header">
                <div class="client-avatar">${getInitials(client.nome)}</div>
                <div>
                    <div class="client-name">${client.nome}</div>
                    <div class="client-status">${client.compras} compras confirmadas</div>
                </div>
            </div>
            
            <div class="client-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Gasto (LTV)</span>
                    <span class="stat-value" style="color: var(--success);">${formatCurrency(client.totalGasto)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Dívida / Pendente</span>
                    <span class="stat-value" ${debtAlert}>${debtText}</span>
                </div>
            </div>

            <div class="fav-product">
                <i class="fa-solid fa-heart fav-icon"></i>
                <div style="font-size: 0.85rem">
                    <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Preferência</div>
                    <strong style="color: var(--text-main);">${client.produtoFavorito}</strong>
                </div>
            </div>

            <div class="action-buttons">
                <button class="btn-icon btn-whatsapp" onclick="window.open('https://wa.me/?text=${encodedMsg}', '_blank')">
                    <i class="fa-brands fa-whatsapp"></i> Contato
                </button>
                <button class="btn-icon btn-details" onclick="openHistory('${client.nome.replace(/'/g, "\\'")}')">
                    <i class="fa-solid fa-list"></i> Histórico
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Modal de Histórico Logic
function openHistory(clientName) {
    const client = allClients.find(c => c.nome === clientName);
    if (!client) return;

    document.getElementById('modalTitle').innerText = `Histórico: ${client.nome}`;
    const list = document.getElementById('historyList');
    list.innerHTML = '';

    // Ordenar histórico por data (mais recente primeiro)
    const sortedHistory = [...client.historico].sort((a, b) => new Date(b.data) - new Date(a.data));

    sortedHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const statusClass = item.status === 'PAGO' ? 'status-pago' : 'status-pendente';
        const displayStatus = item.status === 'PAGO' ? 'Pago' : 'Pendente';

        div.innerHTML = `
            <div>
                <div class="history-prod">${item.produto} (x${item.quantidade})</div>
                <div class="history-date">${formatDate(item.data)}</div>
            </div>
            <div class="history-meta">
                <div style="font-weight: 700;">${formatCurrency(item.valor)}</div>
                <span class="status-badge ${statusClass}" style="font-size: 0.65rem; padding: 0.1rem 0.5rem;">${displayStatus}</span>
            </div>
        `;
        list.appendChild(div);
    });

    document.getElementById('historyModal').style.display = 'flex';
}

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('historyModal').style.display = 'none';
});

window.onclick = function(event) {
    const modal = document.getElementById('historyModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

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

loadClientes();
