import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sqlite3
import json
from datetime import datetime
import uuid
import requests
from typing import Dict, Optional

DB_PATH = 'tasks.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_email_settings() -> Optional[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM settings LIMIT 1')
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)

def send_email(to: str, subject: str, body: str) -> bool:
    settings = get_email_settings()
    if not settings or not settings.get('email_enabled'):
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.get('email_from', settings.get('email_username'))
        msg['To'] = to
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        server = smtplib.SMTP(
            settings.get('email_smtp_host', 'smtp.gmail.com'),
            int(settings.get('email_smtp_port', 587))
        )
        server.starttls()
        server.login(settings.get('email_username'), settings.get('email_password'))
        text = msg.as_string()
        server.sendmail(msg['From'], to, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_webhook(url: str, payload: Dict) -> bool:
    try:
        response = requests.post(url, json=payload, timeout=10)
        return response.status_code in (200, 201, 204)
    except Exception as e:
        print(f"Webhook error: {e}")
        return False

def send_task_reminder(task: Dict) -> bool:
    subject = f"任务提醒: {task['content']}"
    body = f"""
任务: {task['content']}
优先级: {task.get('priority', 'medium')}
截止日期: {task.get('due_date', '未设置')}

请及时完成此任务！
"""
    settings = get_email_settings()
    if settings and settings.get('email_to'):
        return send_email(settings['email_to'], subject, body)
    return False

def create_backup(name: Optional[str] = None) -> Dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    backup_id = str(uuid.uuid4())
    
    data = {}
    for table in ['tasks', 'subtasks', 'settings', 'tags', 'categories', 'time_logs', 
                  'recurring_tasks', 'task_templates', 'okrs', 'key_results']:
        try:
            cursor.execute(f'SELECT * FROM {table}')
            data[table] = [dict(row) for row in cursor.fetchall()]
        except:
            pass
    
    backup_name = name or f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    cursor.execute('''
        INSERT INTO backups (id, name, data, created_at)
        VALUES (?, ?, ?, ?)
    ''', (backup_id, backup_name, json.dumps(data, ensure_ascii=False), datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
    return {
        'id': backup_id,
        'name': backup_name,
        'created_at': datetime.now().isoformat()
    }

def list_backups() -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, created_at FROM backups ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def restore_backup(backup_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT data FROM backups WHERE id = ?', (backup_id,))
    row = cursor.fetchone()
    if not row:
        return False
    
    data = json.loads(row['data'])
    
    for table, rows in data.items():
        if rows:
            for row_data in rows:
                placeholders = ', '.join(['?'] * len(row_data))
                columns = ', '.join(row_data.keys())
                values = list(row_data.values())
                try:
                    cursor.execute(f'INSERT OR REPLACE INTO {table} ({columns}) VALUES ({placeholders})', values)
                except Exception as e:
                    print(f"Restore error for {table}: {e}")
    
    conn.commit()
    conn.close()
    return True

def delete_backup(backup_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM backups WHERE id = ?', (backup_id,))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0
