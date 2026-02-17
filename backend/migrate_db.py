import sqlite3
import os

DB_PATH = os.path.join('instance', 'evaluation.db')

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}, skipping migration.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check subjects table
        cursor.execute("PRAGMA table_info(subjects)")
        subj_columns = [info[1] for info in cursor.fetchall()]
        
        if 'class_name' not in subj_columns:
            print("Adding 'class_name' column to subjects...")
            cursor.execute("ALTER TABLE subjects ADD COLUMN class_name VARCHAR(100)")
        
        if 'academic_year' not in subj_columns:
            print("Adding 'academic_year' column to subjects...")
            cursor.execute("ALTER TABLE subjects ADD COLUMN academic_year VARCHAR(20)")

        # Check answer_sheets table
        cursor.execute("PRAGMA table_info(answer_sheets)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'remarks' not in columns:
            print("Adding 'remarks' column...")
            cursor.execute("ALTER TABLE answer_sheets ADD COLUMN remarks TEXT")
        else:
            print("'remarks' column already exists.")
            
        if 'status' not in columns:
            print("Adding 'status' column...")
            cursor.execute("ALTER TABLE answer_sheets ADD COLUMN status VARCHAR(50) DEFAULT 'pending'")
        else:
            print("'status' column already exists.")
            
        if 'subject_id' not in columns:
            print("Adding 'subject_id' column to answer_sheets...")
            cursor.execute("ALTER TABLE answer_sheets ADD COLUMN subject_id INTEGER REFERENCES subjects(id)")

        # Check question_papers table
        cursor.execute("PRAGMA table_info(question_papers)")
        qp_columns = [info[1] for info in cursor.fetchall()]
        if 'subject_id' not in qp_columns:
            print("Adding 'subject_id' column to question_papers...")
            cursor.execute("ALTER TABLE question_papers ADD COLUMN subject_id INTEGER REFERENCES subjects(id)")

        # Check evaluation_rubrics table
        cursor.execute("PRAGMA table_info(evaluation_rubrics)")
        er_columns = [info[1] for info in cursor.fetchall()]
        if 'subject_id' not in er_columns:
            print("Adding 'subject_id' column to evaluation_rubrics...")
            cursor.execute("ALTER TABLE evaluation_rubrics ADD COLUMN subject_id INTEGER REFERENCES subjects(id)")

        conn.commit()
        print("Migration successful.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
