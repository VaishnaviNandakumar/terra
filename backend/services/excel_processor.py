import pandas as pd
import msoffcrypto
import io

class ExcelProcessor:
    def __init__(self):
        self.decrypted_stream = None  # Used to reuse decrypted content if needed

    def is_password_protected(self, file_path):
        try:
            with open(file_path, 'rb') as f:
                office_file = msoffcrypto.OfficeFile(f)
                office_file.load_key(password=None)
                decrypted = io.BytesIO()
                office_file.decrypt(decrypted)
                pd.read_excel(decrypted)
            return False
        except msoffcrypto.exceptions.InvalidKeyError:
            return True
        except Exception:
            return False  # Other errors treated as not password-protected

    def _decrypt_excel(self, file_path, password):
        """Decrypts an Excel file and stores the decrypted stream"""
        with open(file_path, 'rb') as f:
            office_file = msoffcrypto.OfficeFile(f)
            office_file.load_key(password=password)
            decrypted = io.BytesIO()
            office_file.decrypt(decrypted)
            decrypted.seek(0)
            self.decrypted_stream = decrypted

    def find_data_start(self, df, min_consecutive_rows=3, min_non_empty_cols=4):
        for i in range(len(df) - min_consecutive_rows):
            block = df.iloc[i:i+min_consecutive_rows]
            valid_rows = block.apply(lambda row: row.count() >= min_non_empty_cols, axis=1)
            if valid_rows.all():
                return i
        return -1

    def load(self, file_path, password=None):
        """Loads the decrypted Excel into a DataFrame"""
        try:
            if password:
                self._decrypt_excel(file_path, password)
                df_raw = pd.read_excel(self.decrypted_stream, header=None)
            else:
                df_raw = pd.read_excel(file_path, header=None)
        except Exception as e:
            raise ValueError(f"Failed to open Excel file: {e}")

        start_row = self.find_data_start(df_raw)
        if start_row == -1:
            raise ValueError("Could not find the start of the transaction table.")

        try:
            if password:
                self.decrypted_stream.seek(0)
                df = pd.read_excel(self.decrypted_stream, skiprows=start_row)
            else:
                df = pd.read_excel(file_path, skiprows=start_row)
        except Exception as e:
            raise ValueError(f"Failed to parse Excel content: {e}")

        df = df.dropna(how='all')
        return df
