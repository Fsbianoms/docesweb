import pandas as pd
import json
import math
import warnings
import requests
import io
import os
import sys

warnings.simplefilter(action='ignore', category=UserWarning)

# Link padrão (usado caso não venha argumento)
DEFAULT_URL = "https://docs.google.com/spreadsheets/d/1uRTFD_fjpih_4xghJF34fYgrVPPrjpqe/export?format=xlsx"
# Backup local
file_path = "Estou compartilhando o arquivo 'Janeiro-2026 Atual-3' com você.xlsx"

# Se vier um argumento via linha de comando, usamos ele como URL
if len(sys.argv) > 1:
    input_url = sys.argv[1]
    # Se for um link de edição, transformamos em link de exportação
    if "/edit" in input_url:
        EXCEL_URL = input_url.split("/edit")[0] + "/export?format=xlsx"
    else:
        EXCEL_URL = input_url
else:
    EXCEL_URL = DEFAULT_URL

def is_nan(value):
    if isinstance(value, float) and math.isnan(value):
        return True
    return False

all_sales = []

try:
    print(f"Buscando dados no link: {EXCEL_URL[:50]}...")
    try:
        response = requests.get(EXCEL_URL, timeout=15)
        if response.status_code == 200:
            excel_content = io.BytesIO(response.content)
            xls = pd.ExcelFile(excel_content)
            source = "Google Drive (Link dinâmico)"
        else:
            print(f"Erro ao acessar link (Status {response.status_code}). Usando arquivo local.")
            xls = pd.ExcelFile(file_path)
            source = "Local"
    except Exception as e:
        print(f"Erro de conexão: {e}. Usando arquivo local.")
        xls = pd.ExcelFile(file_path)
        source = "Local"

    for sheet_name in xls.sheet_names:
        # Pula abas irrelevantes
        month_keywords = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        if not any(month in sheet_name for month in month_keywords):
            continue
            
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        
        # Encontrar a linha de cabeçalho
        header_idx = -1
        for i, row in df.iterrows():
            row_str = [str(x).strip() for x in row.values]
            if 'Cliente' in row_str:
                header_idx = i
                break
        
        if header_idx == -1:
            continue
            
        headers = df.iloc[header_idx].values
        col_map = {}
        for idx, col_name in enumerate(headers):
            if is_nan(col_name) or not isinstance(col_name, str): continue
            col_name = col_name.strip()
            if 'Cliente' in col_name: col_map['cliente'] = idx
            elif 'Produto' in col_name: col_map['produto'] = idx
            elif 'Quantidade' in col_name: col_map['quantidade'] = idx
            elif 'Valor' in col_name: col_map['valor'] = idx
            elif 'Status' in col_name: col_map['status'] = idx
            elif 'Data da Venda' in col_name: col_map['data_venda'] = idx
        
        for i in range(header_idx + 1, len(df)):
            row = df.iloc[i]
            if is_nan(row[col_map.get('cliente', 0)]) and is_nan(row[col_map.get('produto', 0)]):
                continue
            
            cliente = str(row[col_map['cliente']]) if 'cliente' in col_map and not is_nan(row[col_map['cliente']]) else "Desconhecido"
            produto = str(row[col_map['produto']]) if 'produto' in col_map and not is_nan(row[col_map['produto']]) else "Desconhecido"
            quantidade = row[col_map['quantidade']] if 'quantidade' in col_map else 0
            try: quantidade = float(quantidade)
            except: quantidade = 0
            
            valor = row[col_map['valor']] if 'valor' in col_map else 0
            try: valor = float(valor)
            except: valor = 0
            
            status = str(row[col_map['status']]).strip().upper() if 'status' in col_map and not is_nan(row[col_map['status']]) else "PENDENTE"
            
            data_venda = row[col_map['data_venda']] if 'data_venda' in col_map else ""
            if pd.isnull(data_venda): data_venda = ""
            elif hasattr(data_venda, "strftime"): data_venda = data_venda.strftime("%Y-%m-%d")
            else: data_venda = str(data_venda)

            all_sales.append({
                "mes": sheet_name,
                "cliente": cliente,
                "produto": produto,
                "quantidade": int(float(quantidade)) if not is_nan(quantidade) else 0,
                "valor": float(valor) if not is_nan(valor) else 0.0,
                "status": status,
                "data": data_venda
            })

    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(all_sales, f, ensure_ascii=False, indent=2)
    print(f"Dados exportados de {source} para data.json com sucesso!")

except Exception as e:
    print(f"Erro ao processar: {e}")
