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
const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "nan") return "-";
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
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

    // 4. Atualizar Gráficos
    updateCharts(productSalesMap, statusMap);
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
function updateCharts(productMap, statusMap) {
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

    /** Gráfico de Status (Rosca/Doughnut) **/
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    
    if (statusChartInst) {
        statusChartInst.destroy();
    }

    statusChartInst = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Recebido (Pago)', 'A Receber (Pendente)'],
            datasets: [{
                data: [statusMap['PAGO'], statusMap['PENDENTE']],
                backgroundColor: ['#0df0a3', '#fbc116'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20 }
                }
            }
        }
    });
}

// Iniciar
loadData();
