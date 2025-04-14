from flask import Flask
from flask_cors import CORS
from models import db
from routes.settings.host import host_bp
from routes.settings.xapi import xapi_bp
from routes.settings.storage import storage_bp
from routes.settings.vm import vm_bp
from routes.backup import backup_bp
from routes.settings.job import job_bp
from routes.restore import restore_bp
import dotenv, os

def create_app():
    dotenv.load_dotenv()
    app = Flask(__name__)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///backup_tool.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    dev_ip = os.getenv("DEV_IP")
    fe_port = os.getenv("FE_PORT")
    cors_origin = f"http://{dev_ip}:{fe_port}"
    
    db.init_app(app)

    app.register_blueprint(host_bp, url_prefix="/api")
    app.register_blueprint(xapi_bp, url_prefix="/api")
    app.register_blueprint(storage_bp, url_prefix="/api")
    app.register_blueprint(vm_bp, url_prefix="/api")
    app.register_blueprint(backup_bp, url_prefix="/api")
    app.register_blueprint(job_bp, url_prefix="/api")
    app.register_blueprint(restore_bp, url_prefix="/api")
    
    
    CORS(app, resources={r"/api/*": {"origins": cors_origin}})

    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host='0.0.0.0', threaded=True)
