import pandas as pd

class CSVProcessor:
    def is_password_protected(self, file_path):
        return False

    def load(self, file_path, password=None):
        df = pd.read_csv(file_path)
        return df