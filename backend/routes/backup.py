import XenAPI
from flask import Blueprint, request, jsonify
from models import db, Host, Backup
from pytz import timezone

WIB = timezone('Asia/Jakarta')
backup_bp = Blueprint("backup_bp", __name__)

@backup_bp.route('/backup/add', methods=['POST'])
def add_backup():
    data = request.json

    try:
        new_backup = Backup(
            name=data['name'],
            description=data['description'],
            sr_uuid=data['sr_uuid'],
            sr_name=data['sr_name'],
            vm_uuid=data['vm_uuid'],
            vm_name=data['vm_name'],
            host_ip=data['host_ip'],
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
            'name': b.name,
            'description': b.description,
            'sr_uuid': b.sr_uuid,
            'sr_name': b.sr_name,
            'vm_uuid': b.vm_uuid,
            'vm_name': b.vm_name,
            'host_ip': b.host_ip,
            'active': b.active,
            'retention': b.retention,
            'cron_schedule': b.cron_schedule,
            'created_at': b.created_at.isoformat()
        }
        for b in backups
    ])

@backup_bp.route('/backup/list/<int:backup_id>', methods=['GET'])
def list_backup_by_id(backup_id):
    backup = Backup.query.get(backup_id)

    if not backup:
        return jsonify({'error': 'Backup not found'}), 404

    return jsonify({
        'id': backup.id,
        'name': backup.name,
        'description': backup.description,
        'sr_uuid': backup.sr_uuid,
        'sr_name': backup.sr_name,
        'vm_uuid': backup.vm_uuid,
        'vm_name': backup.vm_name,
        'host_ip': backup.host_ip,
        'active': backup.active,
        'retention': backup.retention,
        'cron_schedule': backup.cron_schedule,
        'created_at': backup.created_at.astimezone(WIB).isoformat()
    })




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
