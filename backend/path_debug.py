from app import create_app
from models import db
import os

app = create_app()
with app.app_context():
    print(f"Working Directory: {os.getcwd()}")
    print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    # This might print the engine's URL which could be absolute
    from sqlalchemy import inspect
    engine = db.engine
    print(f"Engine URL: {engine.url}")
    
    # Check if we can see the columns
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('subjects')]
    print(f"Columns for 'subjects': {columns}")
