---
name: DocesWeb Project
description: Informações, regras e progresso do sistema de gestão da Doceria do cliente.
---

# DocesWeb - Sistema de Gestão de Confeitaria

## Objetivo do Projeto
Transformar as planilhas do usuário em um **Web App Progressivo (Cloud)**, focado em um Dashboard de faturamento e CRM (Gestão de Clientes). O sistema agora é lido diretamente de um link do Google Sheets e está hospedado na nuvem (Render), permitindo acesso de qualquer celular.

## Tecnologias e Arquitetura - Versão Cloud
- **Processamento de Dados**: Script em Python (`parse_data.py`) adaptado para baixar a planilha via URL do Google Drive.
- **Backend API**: Servidor Flask (`app.py`) configurado para o Render.com.
- **Frontend (Interface)**: HTML5, CSS3 Premium com **foco em Mobile**.
- **Sincronização**: Os dados são lidos da planilha Google e salvos em cache local (`data.json`) para velocidade.
- **Hospedagem**: Repositório no GitHub (`Fsbianoms/docesweb`) conectado ao Render.com.

## Telas e Funcionalidades Atuais
1. **Dashboard 📊**: Resumo financeiro, faturamento pendente, vendas por produto e o **Ranking de Top Clientes**.
2. **CRM / Clientes 👥**: Histórico detalhado de compras por cliente, busca inteligente e filtros por mês.
3. **Sincronização Direta 🔗**: Botão "Planilha" no menu mobile que permite atualizar os dados colando o link do Google Sheets.

## Mobile & Experiência do Usuário (UX)
- **Bottom Navigation**: Barra inferior para fácil acesso com o polegar no celular.
- **Config Modal**: Interface simplificada para troca de link da planilha.
- **Fuso Horário Corrigido**: Datas agora são lidas exatamente como na planilha original.

## Design System (Padrão Visual)
- **Cores**: Pink Doceria (`#f72585`), Mint (`#0df0a3`), Gold Ranking (`#ffd700`).
- **Dark Mode**: Fundo `#0a0e17` com cartões translúcidos e bordas sutis.
- **Tipografia**: `Inter` (Google Fonts).

## Últimas Atualizações Realizadas
- [x] Migração para Modo Leitura (Dashboard/CRM).
- [x] Sincronização dinâmica via Link do Google Sheets.
- [x] Deployment no GitHub e Render.com.
- [x] Implementação do Ranking de Melhores Clientes.
- [x] Correção de datas e Fuso Horário.
- [x] Layout 100% responsivo (estilo App).
