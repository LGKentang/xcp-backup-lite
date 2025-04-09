import XenAPI
from flask import Blueprint, request, jsonify
from models import db, Host

storage_bp = Blueprint("storage_bp", __name__)

import XenAPI
from flask import Blueprint, request, jsonify
from models import db, Host

storage_bp = Blueprint("storage_bp", __name__)

@storage_bp.route('/storage/list', methods=['GET'])
def list_storage_host():
    host_ip = request.args.get('host_ip')

    if not host_ip:
        return jsonify({"error": "Missing 'host_ip' query parameter"}), 400

    host = Host.query.filter_by(host_ip=host_ip).first()
    if not host:
        return jsonify({"error": f"No host found with IP: {host_ip}"}), 404

    try:
        session = XenAPI.Session(f"http://{host.host_ip}")
        session.login_with_password(host.username, host.password)

        sr_refs = session.xenapi.SR.get_all_records()
        sr_list = []

        for sr_ref, sr in sr_refs.items():
            if sr["type"].lower() != "nfs":
                continue 

            sr_list.append({
                "uuid": sr["uuid"],
                "name": sr["name_label"],
                "type": sr["type"],
                "physical_size_gb": round(int(sr["physical_size"]) / (1024 ** 3), 2),
                "physical_utilisation_gb": round(int(sr["physical_utilisation"]) / (1024 ** 3), 2),
                "content_type": sr["content_type"]
            })

        session.logout()
        return jsonify({
            "host_ip": host.host_ip,
            "total_srs": len(sr_list),
            "storage_repositories": sr_list
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to connect to XenAPI or fetch SRs",
            "details": str(e)
        }), 502











