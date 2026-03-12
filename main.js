let salesData = [];
let productChartInst = null;
let statusChartInst = null;

// Estilos de formatação de moeda BRL
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Formatar data
// Formatar data (Corrige o problema de diminuir 1 dia ou mudar devido ao fuso)
const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "nan" || dateStr === "") return "-";
    
    // Se a data vier no formato ISO (YYYY-MM-DD...), pegamos só a parte da data
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            // Retorna DD/MM/YYYY diretamente
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    }
    
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    
    // Fallback caso não seja o formato esperado
    return new Intl.DateTimeFormat('pt-BR').format(date);
};

// Carregar dados
async function loadData() {
    try {
        const response = await fetch('./data.json');
        salesData = await response.json();
        
        // Inicializa com "Todos"
        updateDashboard('Todos');

        // Adicionar evento no select
        document.getElementById('monthSelect').addEventListener('change', (e) => {
            updateDashboard(e.target.value);
        });

        // Lógica de Sincronização Unificada
        const syncData = async (url) => {
            if (url) localStorage.setItem('sheetUrl', url);
            
            const btnSidebar = document.getElementById('syncBtn');
            const btnModal = document.getElementById('syncBtnModal');
            const btns = [btnSidebar, btnModal].filter(b => b);
            
            btns.forEach(b => {
                b.disabled = true;
                b.dataset.oldHtml = b.innerHTML;
                b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
            });

            try {
                const response = await fetch('/api/sync', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url })
                });
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Dados atualizados com sucesso!');
                    location.reload();
                } else {
                    alert('❌ Erro: ' + (result.details || result.message));
                }
            } catch (e) {
                alert('❌ Erro de conexão com o servidor.');
            } finally {
                btns.forEach(b => {
                    b.disabled = false;
                    b.innerHTML = b.dataset.oldHtml;
                });
            }
        };

        const urlInput = document.getElementById('sheetUrlInput');
        const urlInputModal = document.getElementById('sheetUrlInputModal');
        const savedUrl = localStorage.getItem('sheetUrl');
        
        if (savedUrl) {
            if (urlInput) urlInput.value = savedUrl;
            if (urlInputModal) urlInputModal.value = savedUrl;
        }

        // Eventos de clique
        document.getElementById('syncBtn')?.addEventListener('click', () => syncData(urlInput?.value));
        document.getElementById('syncBtnModal')?.addEventListener('click', () => syncData(urlInputModal?.value));

        // Lógica do Modal de Configuração
        const modal = document.getElementById('configModal');
        const openBtn = document.getElementById('openConfigBtn');
        const closeBtn = document.getElementById('closeConfigModal');

        openBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'flex';
        });

        closeBtn?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target == modal) modal.style.display = 'none';
        });

    } catch (error) {
        console.error("Erro ao carregar os dados:", error);
    }
}

// Atualizar dashboard
function updateDashboard(mesBase) {
    let filteredData = salesData;
    
    // Filtrar por mês
    if (mesBase !== 'Todos') {
        filteredData = salesData.filter(item => item.mes === mesBase);
    }
    
    // 1. Calcular Métricas
    let totalRevenue = 0;
    let totalPending = 0;
    let productSalesMap = {};
    let totalItems = 0;
    let statusMap = { 'PAGO': 0, 'PENDENTE': 0 };

    filteredData.forEach(sale => {
        // Receita e Pendentes
        if (sale.status === 'PAGO') {
            totalRevenue += sale.valor;
            statusMap['PAGO'] += sale.valor;
        } else {
            totalPending += sale.valor;
            statusMap['PENDENTE'] += sale.valor;
        }

        // Qtd. Vendida
        totalItems += sale.quantidade;

        // Produtos
        if (sale.produto && sale.produto !== "Desconhecido") {
            if (!productSalesMap[sale.produto]) {
                productSalesMap[sale.produto] = 0;
            }
            productSalesMap[sale.produto] += sale.quantidade;
        }
    });

    // Encontrar produto mais vendido
    let topProduct = "-";
    let maxSales = 0;
    for (const [product, count] of Object.entries(productSalesMap)) {
        if (count > maxSales) {
            maxSales = count;
            topProduct = product;
        }
    }

    // 2. Atualizar UI Cards
    document.getElementById('totalRevenue').innerText = formatCurrency(totalRevenue);
    document.getElementById('totalPending').innerText = formatCurrency(totalPending);
    document.getElementById('topProduct').innerText = topProduct;
    document.getElementById('totalSales').innerText = `${totalItems} unid.`;

    // 3. Atualizar Tabela (mostrar apenas as últimas 15)
    updateTable(filteredData);

    // 4. Calcular Ranking de Clientes
    let customerSalesMap = {};
    filteredData.forEach(sale => {
        if (sale.cliente && sale.cliente !== "Desconhecido") {
            if (!customerSalesMap[sale.cliente]) customerSalesMap[sale.cliente] = 0;
            customerSalesMap[sale.cliente] += sale.valor;
        }
    });

    // 5. Atualizar Gráficos e Ranking
    updateCharts(productSalesMap);
    updateRanking(customerSalesMap);
}

// Atualizar Tabela
function updateTable(data) {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';

    // Filtrar itens inválidos para a tabela
    const validData = data.filter(d => d.produto && d.cliente);
    // Pegar os últimos 15 (como estão na ordem cronológica que foram extraídos)
    const recentData = validData.slice(-15).reverse();

    recentData.forEach(sale => {
        const tr = document.createElement('tr');
        
        // Status badge class
        const statusClass = sale.status === 'PAGO' ? 'status-pago' : 'status-pendente';
        const displayStatus = sale.status === 'PAGO' ? 'Pago' : 'Pendente';

        tr.innerHTML = `
            <td>${formatDate(sale.data)}</td>
            <td><strong>${sale.cliente}</strong></td>
            <td>${sale.produto}</td>
            <td>${sale.quantidade}x</td>
            <td style="font-weight: 600;">${formatCurrency(sale.valor)}</td>
            <td><span class="status-badge ${statusClass}">${displayStatus}</span></td>
        `;

        tbody.appendChild(tr);
    });
}

// Atualizar Gráficos (Chart.js)
function updateCharts(productMap) {
    // Config global para Chart.js combinar com dark mode
    Chart.defaults.color = '#8b9bb4';
    Chart.defaults.font.family = 'Inter';
    
    /** Gráfico de Produtos (Barra) **/
    const productCtx = document.getElementById('productChart').getContext('2d');
    
    // Pegar Top 5 Produtos
    const sortedProducts = Object.entries(productMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const productLabels = sortedProducts.map(i => i[0]);
    const productData = sortedProducts.map(i => i[1]);

    if (productChartInst) {
        productChartInst.destroy();
    }

    productChartInst = new Chart(productCtx, {
        type: 'bar',
        data: {
            labels: productLabels,
            datasets: [{
                label: 'Unidades Vendidas',
                data: productData,
                backgroundColor: '#f72585',
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// Renderizar Ranking de Clientes
function updateRanking(customerMap) {
    const rankingList = document.getElementById('customerRanking');
    rankingList.innerHTML = '';

    const sortedCustomers = Object.entries(customerMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5

    if (sortedCustomers.length === 0) {
        rankingList.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 2rem;">Nenhum dado para este mês.</p>';
        return;
    }

    const maxSpent = sortedCustomers[0][1];

    sortedCustomers.forEach((item, index) => {
        const name = item[0];
        const value = item[1];
        const percentage = (value / maxSpent) * 100;

        const rankDiv = document.createElement('div');
        rankDiv.className = `ranking-item rank-${index + 1}`;
        rankDiv.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${name}</div>
                <div class="rank-bar-bg">
                    <div class="rank-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
            <div class="rank-value">${formatCurrency(value)}</div>
        `;
        rankingList.appendChild(rankDiv);
    });
}

// Iniciar
loadData();
