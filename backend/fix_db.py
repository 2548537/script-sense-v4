import sqlite3
import os

DB_PATHS = [
    os.path.join('instance', 'evaluation.db'),
    'evaluation.db'
]

def migrate_file(db_path):
    if not os.path.exists(db_path):
        print(f"File {db_path} not found.")
        return

    print(f"Migrating {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Subjects table
        cursor.execute("PRAGMA table_info(subjects)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'class_name' not in columns:
            print(f"Adding 'class_name' to {db_path}")
            cursor.execute("ALTER TABLE subjects ADD COLUMN class_name VARCHAR(100)")
        
        if 'academic_year' not in columns:
            print(f"Adding 'academic_year' to {db_path}")
            cursor.execute("ALTER TABLE subjects ADD COLUMN academic_year VARCHAR(20)")

        conn.commit()
        print(f"Successfully migrated {db_path}")
    except Exception as e:
        print(f"Failed migrating {db_path}: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    for path in DB_PATHS:
        migrate_file(path)
