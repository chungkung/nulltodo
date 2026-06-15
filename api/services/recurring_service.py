import sqlite3
from datetime import datetime, timedelta
import uuid
import json
from typing import List, Dict, Any, Optional

DB_PATH = 'tasks.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def parse_recurrence_rule(rule: str) -> Dict:
    try:
        return json.loads(rule)
    except:
        parts = rule.split(' ')
        freq = parts[0] if parts else 'daily'
        interval = int(parts[1]) if len(parts) > 1 else 1
        return {'frequency': freq, 'interval': interval}

def get_next_occurrence(rule: Dict, current_date: str) -> str:
    dt = datetime.fromisoformat(current_date)
    freq = rule.get('frequency', 'daily')
    interval = rule.get('interval', 1)
    
    if freq == 'daily':
        next_dt = dt + timedelta(days=interval)
    elif freq == 'weekly':
        next_dt = dt + timedelta(weeks=interval)
    elif freq == 'monthly':
        next_dt = dt + timedelta(days=30 * interval)
    elif freq == 'yearly':
        next_dt = dt + timedelta(days=365 * interval)
    else:
        next_dt = dt + timedelta(days=1)
    
    return next_dt.isoformat()

def should_generate_task(rule: Dict, last_generated: Optional[str], start_date: str, end_date: Optional[str] = None) -> bool:
    now = datetime.now().isoformat()
    if last_generated:
        next_date = get_next_occurrence(rule, last_generated)
    else:
        next_date = start_date
    
    if end_date and next_date > end_date:
        return False
    
    return next_date <= now

def create_recurring_task(content: str, priority: str, recurrence_rule: str, 
                         start_date: str, end_date: Optional[str] = None) -> Dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    task_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO recurring_tasks (id, content, priority, recurrence_rule, 
                                     start_date, end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (task_id, content, priority, recurrence_rule, start_date, end_date, now, now))
    
    conn.commit()
    conn.close()
    
    return get_recurring_task(task_id)

def get_recurring_task(task_id: str) -> Optional[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM recurring_tasks WHERE id = ?', (task_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_recurring_tasks() -> List[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM recurring_tasks ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_recurring_task(task_id: str, updates: Dict) -> Optional[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    set_clause = ', '.join([f'{k} = ?' for k in updates.keys()])
    values = list(updates.values()) + [task_id]
    
    cursor.execute(f'''
        UPDATE recurring_tasks SET {set_clause}, updated_at = ?
        WHERE id = ?
    ''', values + [datetime.now().isoformat(), task_id])
    
    conn.commit()
    conn.close()
    return get_recurring_task(task_id)

def delete_recurring_task(task_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM recurring_tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0

def generate_tasks_from_recurring() -> List[Dict]:
    from services.task_service import TaskService
    
    task_service = TaskService()
    recurring_tasks = get_all_recurring_tasks()
    generated_tasks = []
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for rt in recurring_tasks:
        rule = parse_recurrence_rule(rt['recurrence_rule'])
        
        if should_generate_task(rule, rt['last_generated'], rt['start_date'], rt['end_date']):
            parsed = {
                'content': rt['content'],
                'priority': rt['priority'],
                'scheduled_at': rt['start_date']
            }
            task = task_service.create_task(parsed)
            generated_tasks.append(task)
            
            cursor.execute('''
                UPDATE recurring_tasks 
                SET last_generated = ?, updated_at = ?
                WHERE id = ?
            ''', (datetime.now().isoformat(), datetime.now().isoformat(), rt['id']))
    
    conn.commit()
    conn.close()
    
    return generated_tasks
