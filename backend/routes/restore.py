from flask import Blueprint, request, jsonify
from models import db, Restore, Backup
from pytz import timezone

WIB = timezone('Asia/Jakarta')
restore_bp = Blueprint("restore_bp", __name__)


@restore_bp.route('/restore/add', methods=['POST'])
def add_restore():
    data = request.json

    try:
        new_restore = Restore(
            host_ip=data['host_ip'],
            sr_uuid=data['sr_uuid'],
            preserve=data.get('preserve'),
            backup_id=data['backup_id'],
            power_on_after_restore=data.get('power_on_after_restore'),
        )
        db.session.add(new_restore)
        db.session.commit()

        return jsonify({'message': 'Restore job added', 'id': new_restore.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@restore_bp.route('/restore/list', methods=['GET'])
def list_restore():
    restores = Restore.query.all()

    return jsonify([
        {
            'id': r.id,
            'sr_uuid': r.sr_uuid,
            'host_ip': r.host_ip,
            'preserve': r.preserve,
            'power_on_after_restore': r.power_on_after_restore,
            'backup_id': r.backup_id,
            'vm_name': r.backup.vm_name,
            'backup_name': r.backup.name if r.backup else None,
            'sr_name': r.backup.sr_name if r.backup else None,
            'restored_at': r.restored_at.astimezone(WIB).isoformat() if r.restored_at else None
        }
        for r in restores
    ])


@restore_bp.route('/restore/list/<int:restore_id>', methods=['GET'])
def list_restore_by_id(restore_id):
    restore = Restore.query.get(restore_id)

    if not restore:
        return jsonify({'error': 'Restore not found'}), 404

    return jsonify({
        'id': restore.id,
        'sr_uuid': restore.sr_uuid,
        'host_ip': restore.host_ip,
        'preserve': restore.preserve,
        'power_on_after_restore': restore.power_on_after_restore,
        'vm_name': restore.backup.vm_name,
        'backup_id': restore.backup_id,
        'backup_name': restore.backup.name if restore.backup else None,
        'sr_name': restore.backup.sr_name if restore.backup else None,
        'restored_at': restore.restored_at.astimezone(WIB).isoformat()
    })


@restore_bp.route('/restore/update/<int:restore_id>', methods=['PATCH'])
def update_restore(restore_id):
    restore = Restore.query.get_or_404(restore_id)
    data = request.json

    for field in ['preserve','power_on_after_restore']:
        if field in data:
            setattr(restore, field, data[field])

    try:
        db.session.commit()
        return jsonify({'message': 'Restore updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


@restore_bp.route('/restore/delete/<int:restore_id>', methods=['DELETE'])
def delete_restore(restore_id):
    restore = Restore.query.get_or_404(restore_id)

    try:
        db.session.delete(restore)
        db.session.commit()
        return jsonify({'message': 'Restore deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
