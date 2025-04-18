from uuid import uuid4
import XenAPI
import os
import time
import re
import paramiko
from datetime import datetime
from flask import Blueprint, request, jsonify
from models import Backup, Host, Job, Restore
from models import db


xapi_bp = Blueprint("xapi_bp", __name__)


@xapi_bp.route('/xapi/test_connection', methods=['POST'])
def xapi_test_connection():
    data = request.get_json()

    if not data or 'host_ip' not in data:
        return jsonify({
            "error": "'host_ip' is required in JSON body.",
            "code": 400
        }), 400

    host_ip = data['host_ip']

    host_record = Host.query.filter_by(host_ip=host_ip).first()
    if not host_record:
        return jsonify({
            "error": f"No host found with IP {host_ip}.",
            "code": 404
        }), 404

    try:
        session = XenAPI.Session(f"http://{host_ip}")
        session.login_with_password(host_record.username, host_record.password)
        session.logout()

        host_record.connected = True
        db.session.commit()

        return jsonify({
            "message": "Connection successful.",
            "code": 200
        }), 200
    except Exception as e:
        return jsonify({
            "error": f"Failed to connect to XenAPI at {host_ip}",
            "details": str(e),
            "code": 502
        }), 502


@xapi_bp.route("/xapi/backup_vm", methods=["POST"])
def backup_vm():
    data = request.get_json()

    host_ip = data.get("host_ip")
    vm_uuid = data.get("vm_uuid")
    sr_uuid = data.get("sr_uuid")
    backup_id = data.get("backup_id")
    print(host_ip, vm_uuid, sr_uuid, backup_id)

    if not all([host_ip, vm_uuid, sr_uuid]):
        return jsonify({"status": "error", "message": "Missing one or more required fields"}), 400

    host = Host.query.filter_by(host_ip=host_ip).first()
    if not host:
        return jsonify({"status": "error", "message": f"No host found with IP {host_ip}"}), 404

    username = host.username
    password = host.password

    job = Job(
        job_uuid=str(uuid4()),
        type="backup",
        status="Running",
        started_at=datetime.utcnow(),
        output_message="Backup job started...",
        backup_id=backup_id
    )
    db.session.add(job)
    db.session.commit()

    backup_name = f"{job.job_uuid}"
    backup_dir = f"/run/sr-mount/{sr_uuid}/xcp-backups/{vm_uuid}"
    os.makedirs(backup_dir, exist_ok=True)
    export_path = f"{backup_dir}/{backup_name}.xva"

    commands = [
        f"xe vm-snapshot uuid={vm_uuid} new-name-label={backup_name}",
        f"SNAP_UUID=$(xe snapshot-list name-label={backup_name} --minimal)",
        "xe template-param-set is-a-template=false ha-always-run=false uuid=$SNAP_UUID",
        f"mkdir -p {backup_dir}",
        f"xe vm-export uuid=$SNAP_UUID filename={export_path} --compress",
        "xe snapshot-uninstall snapshot-uuid=$SNAP_UUID force=true"
    ]

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host_ip, username=username, password=password)

        full_script = "\n".join(commands)
        stdin, stdout, stderr = ssh.exec_command(full_script)

        stdout_result = stdout.read().decode()
        stderr_result = stderr.read().decode()
        ssh.close()

        job.output_message = stdout_result.strip(
        ) if not stderr_result else stderr_result.strip()
        job.status = "Success" if not stderr_result else "Failed"
        job.completed_at = datetime.utcnow()

        db.session.commit()

        if stderr_result:
            return jsonify({
                "status": "error",
                "message": f"Backup failed with error: {stderr_result.strip()}",
                "job_id": job.id,
                "job_status": job.status,
                "output": job.output_message
            }), 500

        return jsonify({
            "status": "success",
            "message": f"Backup completed at: {export_path}",
            "job_id": job.id,
            "job_status": job.status,
            "output": job.output_message,
            "backup_path": export_path
        }), 200

    except Exception as e:
        job.status = "Failed"
        job.output_message = str(e)
        job.completed_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            "status": "error",
            "message": "Backup failed due to exception.",
            "job_id": job.id,
            "job_status": job.status,
            "output": job.output_message
        }), 500

@xapi_bp.route("/xapi/restore", methods=["POST"])
def restore_vm():
    data = request.get_json()

    host_ip = data.get("host_ip")
    sr_uuid = data.get("sr_uuid")
    restore_id = data.get("restore_id")
    job_uuid = data.get("job_uuid")
    backup_id = data.get("backup_id")
    vm_uuid = data.get("vm_uuid", 0)
    is_latest_backup = data.get("is_latest_backup", True)

    if not all([host_ip, sr_uuid, restore_id]):
        return jsonify({
            "status": "error",
            "message": "Missing one or more required fields: host_ip, sr_uuid, job_uuid"
        }), 400
    
    if not is_latest_backup and not restore_id:
        return jsonify({
            "status": "error",
            "message": "If you are not using the latest backup, you must provide a restore_id."
        }), 400

    host = Host.query.filter_by(host_ip=host_ip).first()
    if not host:
        return jsonify({"status": "error", "message": f"No host found with IP {host_ip}"}), 404

    if is_latest_backup:
        latest_backup_job = Job.query.filter_by(type="backup", backup_id=backup_id).order_by(Job.id.desc()).first()
        print(latest_backup_job.restore)

        if not latest_backup_job:
            return jsonify({
                "status": "error",
                "message": "No backup jobs found for the specified backup ID."
            }), 404

        if not latest_backup_job.backup:
            return jsonify({
                "status": "error",
                "message": "No backup job found for the latest backup job."
            }), 404

        vm_uuid = latest_backup_job.backup.vm_uuid
        job_uuid = latest_backup_job.job_uuid

    preserve = db.session.query(Restore.preserve).filter_by(id=restore_id).scalar()
    if preserve is None:
        return jsonify({
            "status": "error",
            "message": "No restore entry found for the given restore_id."
        }), 404

    username = host.username
    password = host.password

    job = Job(
        job_uuid=str(uuid4()),
        type="restore",
        status="Running",
        started_at=datetime.utcnow(),
        output_message="Restore job started...",
        restore_id=restore_id
    )
    db.session.add(job)
    db.session.commit()

    xva_path = f"/var/run/sr-mount/{sr_uuid}/xcp-backups/{vm_uuid}/{job_uuid}.xva"

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host_ip, username=username, password=password)

        command = (
            f"xe vm-import filename={xva_path} "
            f"sr-uuid={sr_uuid} preserve={preserve}"
        )

        stdin, stdout, stderr = ssh.exec_command(command)
        stdout_result = stdout.read().decode().strip()
        stderr_result = stderr.read().decode().strip()
        ssh.close()

        job.completed_at = datetime.utcnow()
        job.output_message = stdout_result if not stderr_result else stderr_result
        job.status = "Success" if not stderr_result else "Failed"
        db.session.commit()

        if stderr_result:
            return jsonify({
                "status": "error",
                "message": f"Restore failed: {stderr_result}",
                "job_id": job.id,
                "job_status": job.status,
                "output": job.output_message
            }), 500

        return jsonify({
            "status": "success",
            "message": "VM restore completed successfully.",
            "job_id": job.id,
            "job_status": job.status,
            "output": job.output_message
        }), 200

    except Exception as e:
        job.completed_at = datetime.utcnow()
        job.status = "Failed"
        job.output_message = str(e)
        db.session.commit()

        return jsonify({
            "status": "error",
            "message": "Restore operation failed due to exception.",
            "job_id": job.id,
            "job_status": job.status,
            "output": job.output_message
        }), 500


# @xapi_bp.route("/xapi/backup_vm_stream", methods=["POST"])
# def backup_vm_stream():
#     data = request.get_json()
#     # extract host_ip, username, password, vm_uuid, sr_uuid as before...

#     def generate():
#         ssh = paramiko.SSHClient()
#         ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
#         ssh.connect(host_ip, username=username, password=password)

#         # Set up all the commands with task tracking
#         backup_name = f"backup-{datetime.now().strftime('%Y%m%dT%H%M%S')}"
#         backup_dir = f"/run/sr-mount/{sr_uuid}/xcp-backups/{backup_name}"
#         export_path = f"{backup_dir}/{backup_name}.xva"

#         # Step-by-step commands
#         setup_cmds = [
#             f"xe vm-snapshot uuid={vm_uuid} new-name-label={backup_name}",
#             f"SNAP_UUID=$(xe snapshot-list name-label={backup_name} --minimal)",
#             "xe template-param-set is-a-template=false ha-always-run=false uuid=$SNAP_UUID",
#             f"mkdir -p {backup_dir}",
#             "TASK_ID=$(xe task-create name-label=backup-task description='Exporting backup')",
#             f"xe vm-export uuid=$SNAP_UUID filename={export_path} --compress async=true task-uuid=$TASK_ID"
#         ]
#         monitor_cmd = "while true; do xe task-show uuid=$TASK_ID | grep progress; sleep 1; done"

#         full_script = "\n".join(setup_cmds + [monitor_cmd])

#         stdin, stdout, stderr = ssh.exec_command(full_script)

#         for line in iter(stdout.readline, ""):
#             yield f"data: {line.strip()}\n\n"
#             time.sleep(1)

#         ssh.close()

#     return Response(stream_with_context(generate()), mimetype='text/event-stream')
