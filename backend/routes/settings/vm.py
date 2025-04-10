import XenAPI
from flask import Blueprint, request, jsonify
from models import db, Host

vm_bp = Blueprint("vm_bp", __name__)


@vm_bp.route("/vm/list", methods=["GET"])
def list_vms():
    host_ip = request.args.get('host_ip')
    host_record = Host.query.filter_by(host_ip=host_ip).first()

    if not host_ip:
        return jsonify({"error": "Missing 'host_ip' query parameter"}), 400

    if not host_record:
        return jsonify({
            "error": f"No host found with IP {host_ip}.",
            "code": 404
        }), 404

    try:
        session = XenAPI.Session(f"http://{host_ip}")
        session.login_with_password(host_record.username, host_record.password)

        vm_data = []
        host_cache = {}

        for vm_ref in session.xenapi.VM.get_all():
            record = session.xenapi.VM.get_record(vm_ref)

            if record.get("is_a_template") or record.get("is_control_domain"):
                continue

            host_ref = record.get("resident_on")
            host_info = {}

            if host_ref:
                if host_ref not in host_cache:
                    try:
                        host_rec = session.xenapi.host.get_record(host_ref)
                        host_cache[host_ref] = {
                            "name_label": host_rec.get("name_label"),
                            "address": host_rec.get("address"),
                            "uuid": host_rec.get("uuid")
                        }
                    except Exception:
                        host_cache[host_ref] = {
                            "name_label": None,
                            "address": None,
                            "uuid": None  # In case of error, set UUID to None
                        }

                host_info = host_cache[host_ref]

            vm_data.append({
                "uuid": record["uuid"],
                "name_label": record["name_label"],
                "power_state": record["power_state"],
                "memory_static_max": int(record["memory_static_max"]),
                "VCPUs_max": int(record["VCPUs_max"]),
                "host_uuid": host_info.get("uuid")
            })

        session.logout()

        return jsonify({
            "vms": vm_data,
            "count": len(vm_data),
            "code": 200
        }), 200

    except Exception as e:
        return jsonify({
            "error": f"Failed to retrieve VMs from {host_ip}",
            "details": str(e),
            "code": 502
        }), 502
