import pandas as pd
import warnings

warnings.simplefilter(action='ignore', category=UserWarning)

file_path = "Estou compartilhando o arquivo 'Janeiro-2026 Atual-3' com você.xlsx"
try:
    xls = pd.ExcelFile(file_path)
    print(f"Sheet names: {xls.sheet_names}")
    for sheet_name in xls.sheet_names:
        print(f"\n--- Sheet: {sheet_name} ---")
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        print("Columns:", df.columns.tolist())
        print(df.head(5).to_markdown())
except Exception as e:
    print(f"Error reading file: {e}")
