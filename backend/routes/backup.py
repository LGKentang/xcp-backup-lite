import XenAPI
from flask import Blueprint, request, jsonify
from models import db, Host, Backup

backup_bp = Blueprint("backup_bp", __name__)

@backup_bp.route('/backup/add', methods=['POST'])
def add_backup():
    data = request.json

    try:
        new_backup = Backup(
            backup_name=data['backup_name'],
            backup_description=data['backup_description'],
            sr_uuid=data['sr_uuid'],
            host_id=data['host_id'],
            active=data['active'],
            retention=data['retention'],
            cron_schedule=data.get('cron_schedule')
        )
        db.session.add(new_backup)
        db.session.commit()
        return jsonify({'message': 'Backup job added', 'id': new_backup.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@backup_bp.route('/backup/list', methods=['GET'])
def list_backup():
    backups = Backup.query.all()
    return jsonify([
        {
            'id': b.id,
            'backup_name': b.backup_name,
            'description': b.backup_description,
            'sr_uuid': b.sr_uuid,
            'host_id': b.host_id,
            'active': b.active,
            'retention': b.retention,
            'cron_schedule': b.cron_schedule,
            'created_at': b.created_at.isoformat()
        }
        for b in backups
    ])


@backup_bp.route('/backup/update/<int:backup_id>', methods=['PATCH'])
def update_backup(backup_id):
    backup = Backup.query.get_or_404(backup_id)
    data = request.json

    for field in ['backup_name', 'backup_description', 'sr_uuid', 'active', 'retention', 'cron_schedule']:
        if field in data:
            setattr(backup, field, data[field])

    try:
        db.session.commit()
        return jsonify({'message': 'Backup updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@backup_bp.route('/backup/delete/<int:backup_id>', methods=['DELETE'])
def delete_backup(backup_id):
    backup = Backup.query.get_or_404(backup_id)

    try:
        db.session.delete(backup)
        db.session.commit()
        return jsonify({'message': 'Backup deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
