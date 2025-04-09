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
    password = db.Column(db.String(128), nullable=False)  # Consider encryption

    storages = db.relationship('Storage', backref='host', lazy=True)
    backup_jobs = db.relationship('BackupJob', backref='host', lazy=True)


class Storage(db.Model):
    __tablename__ = 'storages'

    id = db.Column(db.Integer, primary_key=True)
    nfs_uuid = db.Column(db.String(64), unique=True, nullable=False)
    mount_path = db.Column(db.String(255))
    
    host_id = db.Column(db.Integer, db.ForeignKey('hosts.id'), nullable=False)

    backup_jobs = db.relationship('BackupJob', backref='storage', lazy=True)


class BackupJob(db.Model):
    __tablename__ = 'backup_jobs'

    id = db.Column(db.Integer, primary_key=True)
    backup_job_id = db.Column(db.String(64), default=generate_uuid, unique=True)
    backup_name = db.Column(db.String(100), nullable=False)

    host_id = db.Column(db.Integer, db.ForeignKey('hosts.id'), nullable=False)
    storage_id = db.Column(db.Integer, db.ForeignKey('storages.id'), nullable=False)

    status = db.Column(db.String(32), default='scheduled')  # scheduled, running, done, failed
    retention = db.Column(db.Integer, default=3)
    cron_schedule = db.Column(db.String(64))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    restore_jobs = db.relationship('RestoreJob', backref='backup_job', lazy=True)


class RestoreJob(db.Model):
    __tablename__ = 'restore_jobs'

    id = db.Column(db.Integer, primary_key=True)
    sr_uuid = db.Column(db.String(64), nullable=False)
    preserve = db.Column(db.Boolean, default=True)
    
    backup_job_id = db.Column(db.Integer, db.ForeignKey('backup_jobs.id'), nullable=True)
    restored_at = db.Column(db.DateTime, default=datetime.utcnow)
