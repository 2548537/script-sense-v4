import sqlite3
import os

db_path = os.path.join('instance', 'evaluation.db')
print(f"Checking {db_path}...")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_col(table, col, dtype):
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [info[1] for info in cursor.fetchall()]
    if col not in cols:
        print(f"Adding {col} to {table}...")
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {dtype}")
            print(f"Success")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print(f"{col} already in {table}")

# Table: subjects
add_col('subjects', 'class_name', 'VARCHAR(100)')
add_col('subjects', 'academic_year', 'VARCHAR(20)')

# Table: answer_sheets
add_col('answer_sheets', 'subject_id', 'INTEGER')
add_col('answer_sheets', 'class_name', 'VARCHAR(100)')

# Table: question_papers
add_col('question_papers', 'subject_id', 'INTEGER')

# Table: evaluation_rubrics
add_col('evaluation_rubrics', 'subject_id', 'INTEGER')

conn.commit()
conn.close()
print("Done.")
