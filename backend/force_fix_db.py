import sqlite3
import os

db_path = os.path.join('instance', 'evaluation.db')
print(f"Checking {db_path}...")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get existing columns
cursor.execute("PRAGMA table_info(subjects)")
columns = [info[1] for info in cursor.fetchall()]
print(f"Current columns: {columns}")

# Add missing columns
needed = [
    ('class_name', 'VARCHAR(100)'),
    ('academic_year', 'VARCHAR(20)')
]

for col, dtype in needed:
    if col not in columns:
        print(f"Adding {col}...")
        try:
            cursor.execute(f"ALTER TABLE subjects ADD COLUMN {col} {dtype}")
            print(f"Successfully added {col}")
        except Exception as e:
            print(f"Error adding {col}: {e}")

conn.commit()

# Final check
cursor.execute("PRAGMA table_info(subjects)")
final_columns = [info[1] for info in cursor.fetchall()]
print(f"Final columns: {final_columns}")

conn.close()
