import pandas as pd
import requests
import io

# Link de exportação direta para XLSX do Google Sheets
url = "https://docs.google.com/spreadsheets/d/1uRTFD_fjpih_4xghJF34fYgrVPPrjpqe/export?format=xlsx"

print(f"Tentando ler planilha do Google Drive...")

try:
    response = requests.get(url)
    if response.status_code == 200:
        # Tenta carregar com pandas
        df = pd.read_excel(io.BytesIO(response.content), sheet_name=None) # Carrega todas as abas
        print("✓ Conexão com Google Drive estabelecida com sucesso!")
        print(f"✓ Abas encontradas: {list(df.keys())}")
        
        # Mostra as primeiras linhas da primeira aba encontrada que não seja vazia
        for sheet in df:
            if not df[sheet].empty:
                print(f"\nResumo da aba {sheet}:")
                print(df[sheet].head(3))
                break
    else:
        print(f"× Erro ao acessar: Status {response.status_code}")
except Exception as e:
    print(f"× Erro técnico: {e}")
