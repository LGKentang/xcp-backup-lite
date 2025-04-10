from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class Host(db.Model):
    __tablename__ = 'hosts'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    host_ip = db.Column(db.String(45), nullable=False, unique=True)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(128), nullable=False) 
    connected = db.Column(db.Boolean, default=False, nullable=False)

    backup_jobs = db.relationship('Backup', backref='host', lazy=True)


class Backup(db.Model):
    __tablename__ = 'backups'

    id = db.Column(db.Integer, primary_key=True)
    backup_name = db.Column(db.String(100), nullable=False)
    backup_description = db.Column(db.String(200), nullable=False)
    sr_uuid = db.Column(db.String(64), nullable=False)

    host_id = db.Column(db.Integer, db.ForeignKey('hosts.id'), nullable=False)
    active = db.Column(db.Boolean, nullable=False)
    retention = db.Column(db.Integer, nullable=False)
    cron_schedule = db.Column(db.String(50), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    restore_jobs = db.relationship('Restore', backref='backup', lazy=True)


class Restore(db.Model):
    __tablename__ = 'restores'

    id = db.Column(db.Integer, primary_key=True)
    sr_uuid = db.Column(db.String(64), nullable=False)
    preserve = db.Column(db.Boolean, default=True)
    
    backup_id = db.Column(db.Integer, db.ForeignKey('backups.id'), nullable=True)
    restored_at = db.Column(db.DateTime, default=datetime.utcnow)


class Run(db.Model):
    __tablename__ = 'runs'

    id = db.Column(db.Integer, primary_key=True)
    run_uuid = db.Column(db.String(64), default=generate_uuid, unique=True)
    type = db.Column(db.String(20), nullable=False)  # "backup" or "restore"
    output_message = db.Column(db.Text, nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
