import sqlite3
from datetime import datetime
import uuid
from typing import List, Dict, Any, Optional

DB_PATH = 'tasks.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_template(name: str, content: str, description: Optional[str] = None, 
                   priority: str = 'medium', estimated_hours: float = 1.0, 
                   tags: Optional[str] = None, icon: Optional[str] = None) -> Dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    template_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO task_templates (id, name, description, content, priority, 
                                   estimated_hours, tags, icon, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (template_id, name, description, content, priority, estimated_hours, tags, icon, now, now))
    
    conn.commit()
    conn.close()
    
    return get_template(template_id)

def get_template(template_id: str) -> Optional[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM task_templates WHERE id = ?', (template_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_templates() -> List[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM task_templates ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_template(template_id: str, updates: Dict) -> Optional[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    set_clause = ', '.join([f'{k} = ?' for k in updates.keys()])
    values = list(updates.values()) + [template_id]
    
    cursor.execute(f'''
        UPDATE task_templates SET {set_clause}, updated_at = ?
        WHERE id = ?
    ''', values + [datetime.now().isoformat(), template_id])
    
    conn.commit()
    conn.close()
    return get_template(template_id)

def delete_template(template_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM task_templates WHERE id = ?', (template_id,))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0

def use_template(template_id: str, scheduled_at: Optional[str] = None):
    from services.task_service import TaskService
    
    task_service = TaskService()
    template = get_template(template_id)
    if not template:
        return None
    
    parsed = {
        'content': template['content'],
        'priority': template['priority'],
        'estimated_hours': template['estimated_hours'],
        'scheduled_at': scheduled_at
    }
    return task_service.create_task(parsed)
