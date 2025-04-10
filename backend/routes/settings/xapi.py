import XenAPI, os, time, re, paramiko
from datetime import datetime
from flask import Blueprint, request, jsonify
from models import Host 
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
    username = data.get("username")
    password = data.get("password")
    vm_uuid = data.get("vm_uuid")
    sr_uuid = data.get("sr_uuid")

    if not all([host_ip, username, password, vm_uuid, sr_uuid]):
        return jsonify({"status": "error", "message": "Missing one or more required fields"}), 400

    timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")
    backup_name = f"{vm_uuid}-{timestamp}"
    backup_dir = f"/run/sr-mount/{sr_uuid}/xcp-backups/{vm_uuid}"
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

        if stderr_result:
            return jsonify({
                "status": "error",
                "message": f"SSH Error: {stderr_result.strip()}"
            }), 500

        return jsonify({
            "status": "success",
            "message": f"Backup complete at: {export_path}",
            "output": stdout_result.strip(),
            "backup_path": export_path
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Backup failed: {str(e)}"
        }), 500
        
@xapi_bp.route("/xapi/restore", methods=["POST"])
def restore_vm():
    data = request.get_json()

    host_ip = data.get("host_ip")
    username = data.get("username")
    password = data.get("password")
    sr_uuid = data.get("sr_uuid")
    xva_path = data.get("xva_path") 

    if not all([host_ip, username, password, sr_uuid, xva_path]):
        return jsonify({
            "status": "error",
            "message": "Missing one or more required fields: host_ip, username, password, sr_uuid, xva_path"
        }), 400

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host_ip, username=username, password=password)

        import_cmd = (
            f"xe vm-import filename={xva_path} "
            f"sr-uuid={sr_uuid} preserve=true"
        )

        stdin, stdout, stderr = ssh.exec_command(import_cmd)
        stdout_result = stdout.read().decode()
        stderr_result = stderr.read().decode()
        ssh.close()

        if stderr_result:
            return jsonify({
                "status": "error",
                "message": f"Restore failed: {stderr_result.strip()}"
            }), 500

        return jsonify({
            "status": "success",
            "message": "VM restore completed successfully.",
            "output": stdout_result.strip()
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Restore operation failed: {str(e)}"
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