---
name: DocesWeb Project
description: Informações, regras e progresso do sistema de gestão da Doceria do cliente.
---

# DocesWeb - Sistema de Gestão de Confeitaria

## Objetivo do Projeto
Transformar as planilhas do usuário ("Janeiro-2026 Atual-3") em um sistema web completo e dinâmico, facilitando o controle de caixa, fiados (CRM), vendas e estoque. O sistema é voltado para uma doceria, com métricas que ajudam a entender o faturamento rápido e recuperar valores pendentes por WhatsApp.

## Tecnologias e Arquitetura
- **Processamento de Dados**: Script em Python (`parse_data.py`) que usa `pandas` para ler e limpar as planilhas complexas em Excel.
- **Backend API**: Servidor Flask (`vendas_api.py`) que permite o registro de novas vendas via Web diretamente no Excel.
- **Frontend (Interface)**: HTML5, CSS3 Nativo e JavaScript para lógica de tela e gráficos (`Chart.js`).
- **Banco de Dados**: O arquivo Excel (`.xlsx`) é a fonte da verdade. O sistema escreve nele e gera o `data.json` automaticamente.

## Telas do Sistema
1. **Dashboard (`index.html`)**: Resumo financeiro e gráficos.
2. **Clientes/CRM (`clientes.html`)**: Perfis de faturamento e histórico por cliente.
3. **Vendas (`vendas.html`)**: Formulário inteligente que insere novas linhas na aba do mês correto da sua planilha Excel.
4. **Estoque (`estoque.html`)**: *Página em construção*.

## Design System (Anotações para não perder o padrão)
- Fonte: `Inter`
- Cores principais: Pink Doceria (`#f72585`), Purple (`#7209b7`), Mint/Success (`#0df0a3`), Warning (`#fbc116`).
- Dark Theme com cartas (`.metric-card`, `.client-card`) em `#151b29` (com bordas suaves) e fundo principal `#0a0e17`.
- Animações de `hover` nos botões e cartões (`transform: translateY(-5px)`).

## Problemas Corrigidos Recentemente
* Sincronizado a Sidebar (menu lateral) em todas as páginas e links corrigidos, arrumando o bug onde botões perdiam o estado ou o nome "CRM" sumia do menu ao ir para a index.
