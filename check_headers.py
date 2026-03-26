import pandas as pd
import requests
import io
import math

def is_nan(value):
    if isinstance(value, float) and math.isnan(value):
        return True
    return False

url = 'https://docs.google.com/spreadsheets/d/1uRTFD_fjpih_4xghJF34fYgrVPPrjpqe/export?format=xlsx'
try:
    print(f"Downloading from {url}...")
    r = requests.get(url, timeout=20)
    xls = pd.ExcelFile(io.BytesIO(r.content))
    print(f"Sheets: {xls.sheet_names}")
    for sheet in xls.sheet_names:
        if any(m in sheet for m in ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]):
            df = pd.read_excel(xls, sheet_name=sheet, header=None)
            found = False
            for i, row in df.iterrows():
                row_vals = [str(x).strip() for x in row.values]
                if 'Cliente' in row_vals:
                    print(f"\n--- Headers for sheet: {sheet} (Row {i}) ---")
                    print(row_vals)
                    found = True
                    break
            if not found:
                print(f"Headers not found in {sheet}")
except Exception as e:
    print(f"Error: {e}")
