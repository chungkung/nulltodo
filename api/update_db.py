import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'task_agent.db')

def update_database():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("检查数据库更新...")

    cursor.execute("PRAGMA table_info(subtasks)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'estimated_hours' not in columns:
        print("添加 estimated_hours 列到 subtasks 表...")
        cursor.execute("ALTER TABLE subtasks ADD COLUMN estimated_hours REAL DEFAULT 0.5")
        conn.commit()

    cursor.execute("PRAGMA table_info(tasks)")
    task_columns = [col[1] for col in cursor.fetchall()]

    print("\n检查 tags 表...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tags'")
    if not cursor.fetchone():
        print("创建 tags 表...")
        cursor.execute('''
            CREATE TABLE tags (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                color TEXT DEFAULT '#6366f1',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        print("✓ tags 表创建成功")
    else:
        print("✓ tags 表已存在")

    print("\n检查 task_tags 表...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='task_tags'")
    if not cursor.fetchone():
        print("创建 task_tags 表...")
        cursor.execute('''
            CREATE TABLE task_tags (
                task_id TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                PRIMARY KEY (task_id, tag_id)
            )
        ''')
        conn.commit()
        print("✓ task_tags 表创建成功")
    else:
        print("✓ task_tags 表已存在")

    print("\n检查 categories 表...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'")
    if not cursor.fetchone():
        print("创建 categories 表...")
        cursor.execute('''
            CREATE TABLE categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT DEFAULT 'folder',
                color TEXT DEFAULT '#6366f1',
                sort_order INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        print("✓ categories 表创建成功")
    else:
        print("✓ categories 表已存在")

    print("\n检查 time_logs 表...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='time_logs'")
    if not cursor.fetchone():
        print("创建 time_logs 表...")
        cursor.execute('''
            CREATE TABLE time_logs (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        print("✓ time_logs 表创建成功")
    else:
        print("✓ time_logs 表已存在")

    print("\n检查所有表...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"当前数据库表: {', '.join(tables)}")

    conn.close()
    print("\n✓ 数据库更新完成!")

if __name__ == '__main__':
    update_database()
