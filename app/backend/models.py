
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

# Initialize the SQLAlchemy instance
db = SQLAlchemy()

class Session(db.Model):
    __tablename__ = 'sessions'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), unique=True, nullable=False)
    username = db.Column(db.String(36), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)

class Transactions(db.Model):
    __tablename__ = 'transactions'  
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(36), db.ForeignKey('sessions.session_id'))
    transaction_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    narration = db.Column(db.String(255), nullable=False)
    debit_amount = db.Column(db.Numeric(10, 2), nullable=False)
    product = db.Column(db.String(100))
    mode = db.Column(db.String(50))
    tag = db.Column(db.String(50))


class Expense(db.Model):
    __tablename__ = 'expense_data_view'  
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(36), db.ForeignKey('sessions.session_id'))
    transaction_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    narration = db.Column(db.String(255), nullable=False)
    debit_amount = db.Column(db.Numeric(10, 2), nullable=False)
    product = db.Column(db.String(100))
    mode = db.Column(db.String(50))
    tag = db.Column(db.String(50))


class ProductTag(db.Model):
    __tablename__ = 'product_tags'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), db.ForeignKey('sessions.session_id'))
    product = db.Column(db.String(255), nullable=False)
    tag = db.Column(db.String(255), nullable=False)