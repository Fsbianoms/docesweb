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
DEFAULT_URL = "https://docs.google.com/spreadsheets/d/15bW8mxfES9LwfoWV8TeQxXMqwO6DJoLY/export?format=xlsx"
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
    print(f"Buscando dados no link: {EXCEL_URL[:60]}...")
    try:
        # Tenta baixar o arquivo do Google Drive
        response = requests.get(EXCEL_URL, timeout=30)
        if response.status_code == 200:
            print("Download bem-sucedido. Atualizando cache local...")
            with open(file_path, 'wb') as f:
                f.write(response.content)
            xls = pd.ExcelFile(file_path)
            source = "Google Drive (Link dinâmico)"
        else:
            print(f"Aviso: Link retornou erro {response.status_code}. Usando arquivo local.")
            xls = pd.ExcelFile(file_path)
            source = "Local"
    except Exception as e:
        print(f"Aviso: Falha na conexão ({e}). Usando arquivo local.")
        if os.path.exists(file_path):
            xls = pd.ExcelFile(file_path)
            source = "Local"
        else:
            print("Erro Crítico: Nenhum arquivo local encontrado e falha no download.")
            sys.exit(1)

    for sheet_name in xls.sheet_names:
        # Pula abas irrelevantes
        month_keywords = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        if not any(month in sheet_name for month in month_keywords):
            continue
            
        # Otimização: Pegar apenas as primeiras 20 linhas para achar o cabeçalho
        sample_df = pd.read_excel(xls, sheet_name=sheet_name, header=None, nrows=20)
        
        header_idx = -1
        for i, row in sample_df.iterrows():
            row_str = [str(x).strip().lower() for x in row.values if x is not None]
            if 'cliente' in row_str:
                header_idx = i
                break
        
        if header_idx == -1:
            continue
            
        # Agora ler a planilha completa se o cabeçalho foi achado
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
            
        headers = df.iloc[header_idx].values
        col_map = {}
        for idx, col_name in enumerate(headers):
            if is_nan(col_name) or not isinstance(col_name, str): continue
            col_name_lower = col_name.strip().lower()
            if 'cliente' in col_name_lower: col_map['cliente'] = idx
            elif 'produto' in col_name_lower: col_map['produto'] = idx
            elif 'quant' in col_name_lower: col_map['quantidade'] = idx
            elif 'valor' in col_name_lower: col_map['valor'] = idx
            elif 'status' in col_name_lower: col_map['status'] = idx
            elif 'data da venda' in col_name_lower: col_map['data_venda'] = idx
            elif 'contato' in col_name_lower: col_map['contato'] = idx
            elif 'observ' in col_name_lower and 'contato' not in col_map: col_map['contato'] = idx
        
        for i in range(header_idx + 1, len(df)):
            row = df.iloc[i]
            if is_nan(row[col_map.get('cliente', 0)]) and is_nan(row[col_map.get('produto', 0)]):
                continue
            
            cliente = str(row[col_map['cliente']]) if 'cliente' in col_map and not is_nan(row[col_map['cliente']]) else "Desconhecido"
            contato = str(row[col_map['contato']]) if 'contato' in col_map and not is_nan(row[col_map['contato']]) else ""
            # Limpa o contato para ter apenas números
            if contato:
                contato = "".join(filter(str.isdigit, contato))
                # Se começar com 0, remove
                if contato.startswith("0"): contato = contato[1:]
                
                # Se tiver 8 ou 9 dígitos, assume que é do DDD 67
                if len(contato) <= 9 and not contato.startswith("67"):
                    if len(contato) == 8: contato = "9" + contato
                    contato = "67" + contato
                
                # Se tiver 10 ou 11 dígitos, assume que falta o 55
                if len(contato) in [10, 11] and not contato.startswith("55"):
                    # Se tiver 10 dígitos (DDD + 8), adiciona o 9 extra se for celular (quase todos em BR)
                    if len(contato) == 10:
                        contato = contato[:2] + "9" + contato[2:]
                    contato = "55" + contato
                
                # Se tiver 13 dígitos e começar com 55, está completo
                # Se tiver menos que isso mas parece BR, tentamos completar
            
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
                "contato": contato,
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
