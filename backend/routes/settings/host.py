import XenAPI
from flask import Blueprint, request, jsonify
from models import db, Host

host_bp = Blueprint("host_bp", __name__)

@host_bp.route('/hosts/add', methods=['POST'])
def add_host():
    data = request.get_json()

    required_fields = ['host_ip', 'username', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"'{field}' is required."}), 400

    if Host.query.filter_by(host_ip=data['host_ip']).first():
        return jsonify({"error": "Host with this IP already exists."}), 409
    try:
        session = XenAPI.Session(f"http://{data['host_ip']}")
        session.login_with_password(data['username'], data['password'])
        session.logout()
    except Exception as e:
        return jsonify({
            "error": f"Failed to connect to XenAPI at {data['host_ip']}",
            "details": str(e)
        }), 502

    new_host = Host(
        name=data.get('name', f"Host-{data['host_ip']}"),
        host_ip=data['host_ip'],
        username=data['username'],
        password=data['password']
    )

    db.session.add(new_host)
    db.session.commit()

    return jsonify({
        "message": "Host added successfully.",
        "host": {
            "id": new_host.id,
            "name": new_host.name,
            "host_ip": new_host.host_ip
        }
    }), 201

@host_bp.route('/hosts/list', methods=['GET'])
def list_hosts():
    hosts = Host.query.all()
    result = []

    for host in hosts:
        result.append({
            "id": host.id,
            "name": host.name,
            "host_ip": host.host_ip,
            "username": host.username
            
        })

    return jsonify({
        "total": len(result),
        "hosts": result
    }), 200

@host_bp.route('/hosts/list/connected', methods=['GET'])
def list_validly_connected_hosts():
    connected_hosts = Host.query.filter_by(connected=True).all()
    
    result = [
        {
            "id": host.id,
            "name": host.name,
            "host_ip": host.host_ip,
            "username": host.username
        }
        for host in connected_hosts
    ]

    return jsonify({
        "total": len(result),
        "hosts": result
    }), 200


    
@host_bp.route('/hosts/update/<int:host_ip>', methods=['PATCH'])
def update_host(host_ip):
    data = request.get_json()
    host = Host.query.get(host_ip)

    if not host:
        return jsonify({"error": f"No host found with ID {host_ip}"}), 404

    updatable_fields = ['name' ,'host_ip','username', 'password']
    for field in updatable_fields:
        if field in data:
            setattr(host, field, data[field])

    try:
        db.session.commit()
        return jsonify({
            "message": "Host updated successfully.",
            "host": {
                "id": host.id,
                "name": host.name,
                "host_ip": host.host_ip,
                "username": host.username
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Failed to update host.",
            "details": str(e)
        }), 500


@host_bp.route('/hosts/delete/<int:host_ip>', methods=['DELETE'])
def delete_host(host_ip):
    host = Host.query.get(host_ip)

    if not host:
        return jsonify({"error": f"No host found with ID {host_ip}"}), 404

    try:
        db.session.delete(host)
        db.session.commit()
        return jsonify({"message": "Host deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Failed to delete host.",
            "details": str(e)
        }), 500

@host_bp.route('/hosts/list/active', methods=['GET'])
def list_active_hosts():   
    host_ip = request.args.get('host_ip')

    if not host_ip:
        return jsonify({"error": "Missing 'host_ip' in body"}), 400

    host_record = Host.query.filter_by(host_ip=host_ip).first()
    if not host_record:
        return jsonify({
            "error": f"No host found with IP {host_ip}.",
            "code": 404
        }), 404

    try:
        session = XenAPI.Session(f"http://{host_ip}")
        session.login_with_password(host_record.username, host_record.password)

        hosts = []
        for host_ref in session.xenapi.host.get_all():
            rec = session.xenapi.host.get_record(host_ref)
            hosts.append({
                "uuid": rec.get("uuid"),
                "name_label": rec.get("name_label"),
                "address": rec.get("address"),
                "enabled": rec.get("enabled"),
                "live": rec.get("live")
            })

        session.logout()

        return jsonify({
            "hosts": hosts,
            "count": len(hosts),
            "code": 200
        }), 200

    except Exception as e:
        return jsonify({
            "error": f"Failed to retrieve hosts from master {host_ip}",
            "details": str(e),
            "code": 502
        }), 502
