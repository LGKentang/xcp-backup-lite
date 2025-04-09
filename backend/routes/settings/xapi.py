import XenAPI
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
