import sqlite3
import os

DB_PATH = os.path.join('instance', 'evaluation.db')

def add_col_if_missing(cursor, table, column, col_type, existing_cols):
    if column not in existing_cols:
        print(f"  Adding '{column}' to {table}...")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
    else:
        print(f"  '{column}' already exists in {table} – skipped")

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}, skipping migration.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # ── 1. users table (new) ─────────────────────────────────────────────
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                name          VARCHAR(200) NOT NULL,
                email         VARCHAR(200) NOT NULL UNIQUE,
                password_hash VARCHAR(500) NOT NULL,
                role          VARCHAR(50)  NOT NULL DEFAULT 'faculty',
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✅ users table ready")

        # ── 2. subjects table ────────────────────────────────────────────────
        cursor.execute("PRAGMA table_info(subjects)")
        subj_columns = [info[1] for info in cursor.fetchall()]

        add_col_if_missing(cursor, "subjects", "class_name",          "VARCHAR(100)", subj_columns)
        add_col_if_missing(cursor, "subjects", "academic_year",       "VARCHAR(20)",  subj_columns)
        add_col_if_missing(cursor, "subjects", "first_evaluator_id",  "INTEGER REFERENCES users(id)", subj_columns)
        add_col_if_missing(cursor, "subjects", "second_evaluator_id", "INTEGER REFERENCES users(id)", subj_columns)
        add_col_if_missing(cursor, "subjects", "created_by",          "INTEGER REFERENCES users(id)", subj_columns)
        print("✅ subjects table ready")

        # ── 3. answer_sheets table ───────────────────────────────────────────
        cursor.execute("PRAGMA table_info(answer_sheets)")
        as_columns = [info[1] for info in cursor.fetchall()]

        add_col_if_missing(cursor, "answer_sheets", "remarks",        "TEXT",         as_columns)
        add_col_if_missing(cursor, "answer_sheets", "status",         "VARCHAR(50) DEFAULT 'UPLOADED'", as_columns)
        add_col_if_missing(cursor, "answer_sheets", "subject_id",     "INTEGER REFERENCES subjects(id)", as_columns)
        add_col_if_missing(cursor, "answer_sheets", "teacher_marks",  "REAL",         as_columns)
        add_col_if_missing(cursor, "answer_sheets", "external_marks", "REAL",         as_columns)
        add_col_if_missing(cursor, "answer_sheets", "final_marks",    "REAL",         as_columns)

        # Normalise any NULL/empty status values
        cursor.execute("UPDATE answer_sheets SET status = 'UPLOADED' WHERE status IS NULL OR status = ''")
        print("✅ answer_sheets table ready")

        # ── 4. question_papers table ─────────────────────────────────────────
        cursor.execute("PRAGMA table_info(question_papers)")
        qp_columns = [info[1] for info in cursor.fetchall()]
        add_col_if_missing(cursor, "question_papers", "subject_id", "INTEGER REFERENCES subjects(id)", qp_columns)
        print("✅ question_papers table ready")

        # ── 5. evaluation_rubrics table ──────────────────────────────────────
        cursor.execute("PRAGMA table_info(evaluation_rubrics)")
        er_columns = [info[1] for info in cursor.fetchall()]
        add_col_if_missing(cursor, "evaluation_rubrics", "subject_id", "INTEGER REFERENCES subjects(id)", er_columns)
        print("✅ evaluation_rubrics table ready")

        conn.commit()
        print("\n🎉 Migration complete! Restart the backend server.")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
