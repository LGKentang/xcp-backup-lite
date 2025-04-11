import XenAPI
from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, Job, Backup, Restore
from uuid import uuid4

job_bp = Blueprint("job_bp", __name__)

@job_bp.route('/job/list/backup/<backup_id>', methods=['GET'])
def list_backup_jobs_by_id(backup_id):
    try:
        jobs = Job.query.filter_by(type='backup', backup_id=backup_id).all()

        job_list = [
            {
                'id': job.id,
                'uuid': job.job_uuid,
                'type': job.type,
                'status': job.status,
                'backup_id': job.backup_id,
                'started_at': job.started_at.isoformat() if job.started_at else None,
                'completed_at': job.completed_at.isoformat() if job.completed_at else None,
                'output_message': job.output_message
            }
            for job in jobs
        ]

        return jsonify({
            'message': f'Found {len(job_list)} job(s) for backup_id: {backup_id}',
            'jobs': job_list
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@job_bp.route('/job/add', methods=['POST'])
def add_job():
    data = request.get_json()
    job_type = data.get('type') 
    backup_id = data.get('backup_id')
    restore_id = data.get('restore_id')
    output_message = data.get('output_message', '')
    status = data.get('status', 'Started')

    if job_type not in ['backup', 'restore']:
        return jsonify({'error': 'Invalid job type. Must be "backup" or "restore".'}), 400

    if job_type == 'backup' and not backup_id:
        return jsonify({'error': 'backup_id is required for a backup job'}), 400
    if job_type == 'restore' and not restore_id:
        return jsonify({'error': 'restore_id is required for a restore job'}), 400

    try:
        new_job = Job(
            job_uuid=str(uuid4()),
            type=job_type,
            status=status,
            output_message=output_message,
            started_at=datetime.utcnow(),
            completed_at=None,
            backup_id=backup_id if job_type == 'backup' else None,
            restore_id=restore_id if job_type == 'restore' else None
        )

        db.session.add(new_job)
        db.session.commit()

        return jsonify({
            'message': 'Job added successfully.',
            'job': {
                'id': new_job.id,
                'uuid': new_job.job_uuid,
                'type': new_job.type,
                'status': new_job.status,
                'backup_id': new_job.backup_id,
                'restore_id': new_job.restore_id,
                'started_at': new_job.started_at.isoformat(),
                'completed_at': new_job.completed_at,
                'output_message': new_job.output_message
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
