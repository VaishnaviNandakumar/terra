import pandas as pd
from io import BytesIO

class CSVProcessor:
    def is_password_protected(self, file):
        return False  # CSVs can't be password protected

    def load(self, file, password=None):
        if isinstance(file, str):  # S3 path or local path
            return pd.read_csv(file)
        elif isinstance(file, bytes):  # raw bytes → wrap in BytesIO
            return pd.read_csv(BytesIO(file))
        elif isinstance(file, BytesIO):  # already BytesIO
            file.seek(0)
            return pd.read_csv(file)
        else:
            raise ValueError(f"Unsupported file type for CSVProcessor: {type(file)}")
