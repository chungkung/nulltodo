import sqlite3
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'tasks.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Starting database migration...")
    
    # 1. 周期性任务表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recurring_tasks (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            priority TEXT DEFAULT 'medium',
            recurrence_rule TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT,
            last_generated TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. 任务模板表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            content TEXT NOT NULL,
            priority TEXT DEFAULT 'medium',
            estimated_hours REAL DEFAULT 1,
            tags TEXT,
            icon TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 3. OKR表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS okrs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            start_date TEXT NOT NULL,
            end_date TEXT,
            progress REAL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 4. 关键结果表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS key_results (
            id TEXT PRIMARY KEY,
            okr_id TEXT NOT NULL,
            title TEXT NOT NULL,
            target_value REAL,
            current_value REAL DEFAULT 0,
            unit TEXT,
            FOREIGN KEY (okr_id) REFERENCES okrs(id) ON DELETE CASCADE
        )
    ''')
    
    # 5. 任务-OKR关联表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_okrs (
            task_id TEXT NOT NULL,
            okr_id TEXT NOT NULL,
            PRIMARY KEY (task_id, okr_id),
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (okr_id) REFERENCES okrs(id) ON DELETE CASCADE
        )
    ''')
    
    # 6. 任务依赖表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_dependencies (
            task_id TEXT NOT NULL,
            depends_on_task_id TEXT NOT NULL,
            PRIMARY KEY (task_id, depends_on_task_id),
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
    ''')
    
    # 7. 备份表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS backups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 8. 更新tasks表添加recurring_task_id
    try:
        cursor.execute("ALTER TABLE tasks ADD COLUMN recurring_task_id TEXT")
    except sqlite3.OperationalError:
        pass
    
    # 9. 更新tasks表添加template_id
    try:
        cursor.execute("ALTER TABLE tasks ADD COLUMN template_id TEXT")
    except sqlite3.OperationalError:
        pass
    
    # 10. 更新settings表添加邮件配置
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN email_enabled INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN email_smtp_host TEXT")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN email_smtp_port INTEGER DEFAULT 587")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN email_username TEXT")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN email_password TEXT")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN email_from TEXT")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN email_to TEXT")
    except sqlite3.OperationalError:
        pass
    
    # 11. 添加番茄钟配置
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN pomodoro_work INTEGER DEFAULT 25")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN pomodoro_short_break INTEGER DEFAULT 5")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN pomodoro_long_break INTEGER DEFAULT 15")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE settings ADD COLUMN pomodoro_sessions INTEGER DEFAULT 4")
    except sqlite3.OperationalError:
        pass
    
    conn.commit()
    conn.close()
    
    print("Database migration completed successfully!")

if __name__ == '__main__':
    migrate()
