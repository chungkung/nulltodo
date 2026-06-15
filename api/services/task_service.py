import json
import uuid
from datetime import datetime

def get_db():
    import app as app_module
    return app_module.get_db()

class TaskService:
    def get_all_tasks(self):
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT t.*,
                   (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id AND completed = 0) as pending_subtasks,
                   (SELECT COUNT(*) FROM subtasks WHERE task_id = t.id) as total_subtasks
            FROM tasks t
            ORDER BY
                CASE t.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                END,
                t.deadline ASC
        ''')

        tasks = []
        for row in cursor.fetchall():
            task = dict(row)
            if task.get('deadline') and task['status'] != 'completed':
                try:
                    deadline = datetime.fromisoformat(task['deadline'])
                    if deadline < datetime.now():
                        task['status'] = 'overdue'
                except:
                    pass

            cursor.execute('SELECT * FROM subtasks WHERE task_id = ?', (task['id'],))
            task['subtasks'] = [dict(s) for s in cursor.fetchall()]
            tasks.append(task)

        return tasks

    def get_task(self, task_id: str):
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
        row = cursor.fetchone()

        if row:
            task = dict(row)
            cursor.execute('SELECT * FROM subtasks WHERE task_id = ?', (task_id,))
            task['subtasks'] = [dict(s) for s in cursor.fetchall()]
            return task
        return None

    def create_task(self, parsed: dict) -> dict:
        db = get_db()
        cursor = db.cursor()

        task_id = str(uuid.uuid4())
        now = datetime.now().isoformat()

        task = {
            'id': task_id,
            'content': parsed.get('content', ''),
            'deadline': parsed.get('deadline', ''),
            'estimated_hours': parsed.get('estimated_hours', 1.0),
            'priority': parsed.get('priority', 'medium'),
            'scenario': parsed.get('scenario', 'general'),
            'status': 'pending',
            'created_at': now,
            'updated_at': now,
            'subtasks': []
        }

        cursor.execute('''
            INSERT INTO tasks (id, content, deadline, estimated_hours, priority, scenario, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (task['id'], task['content'], task['deadline'], task['estimated_hours'],
              task['priority'], task['scenario'], task['status'], task['created_at'], task['updated_at']))

        self._log_action(task_id, 'created', None, 'pending')

        db.commit()

        return task

    def update_task(self, task_id: str, updates: dict) -> dict:
        db = get_db()
        cursor = db.cursor()

        updates['updated_at'] = datetime.now().isoformat()

        set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [task_id]

        cursor.execute(f'UPDATE tasks SET {set_clause} WHERE id = ?', values)
        db.commit()

        return self.get_task(task_id)

    def update_task_status(self, task_id: str, status: str) -> dict:
        db = get_db()
        cursor = db.cursor()

        now = datetime.now().isoformat()
        updates = {'status': status, 'updated_at': now}

        if status == 'completed':
            updates['completed_at'] = now

        set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [task_id]

        cursor.execute(f'UPDATE tasks SET {set_clause} WHERE id = ?', values)

        old_status = cursor.execute('SELECT status FROM tasks WHERE id = ?', (task_id,)).fetchone()
        if old_status:
            self._log_action(task_id, 'status_changed', old_status[0], status)

        db.commit()

        return self.get_task(task_id)

    def delete_task(self, task_id: str) -> bool:
        db = get_db()
        cursor = db.cursor()

        cursor.execute('DELETE FROM subtasks WHERE task_id = ?', (task_id,))
        cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
        db.commit()

        return True

    def create_subtask(self, task_id: str, subtask_data: dict) -> dict:
        db = get_db()
        cursor = db.cursor()

        subtask_id = str(uuid.uuid4())
        now = datetime.now().isoformat()

        subtask = {
            'id': subtask_id,
            'task_id': task_id,
            'content': subtask_data.get('content', ''),
            'completed': bool(subtask_data.get('completed', False)),
            'estimated_hours': subtask_data.get('estimated_hours', 0.5),
            'created_at': now
        }

        cursor.execute('''
            INSERT INTO subtasks (id, task_id, content, completed, estimated_hours, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (subtask['id'], subtask['task_id'], subtask['content'], subtask['completed'], subtask['estimated_hours'], subtask['created_at']))

        db.commit()

        return subtask

    def update_subtask_status(self, subtask_id: str, completed: bool) -> dict:
        db = get_db()
        cursor = db.cursor()

        cursor.execute('UPDATE subtasks SET completed = ? WHERE id = ?', (1 if completed else 0, subtask_id))
        db.commit()

        cursor.execute('SELECT * FROM subtasks WHERE id = ?', (subtask_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    def delete_subtask(self, subtask_id: str) -> bool:
        db = get_db()
        cursor = db.cursor()

        cursor.execute('DELETE FROM subtasks WHERE id = ?', (subtask_id,))
        db.commit()

        return True

    def get_settings(self) -> dict:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM settings WHERE id = ?', ('default',))
        row = cursor.fetchone()

        if row:
            settings = dict(row)
            settings['reminder_advance'] = json.loads(settings.get('reminder_advance', '[30, 60]'))
            settings['custom_scenarios'] = json.loads(settings.get('custom_scenarios', '["work","study","life","side-project","social"]'))
            settings['notifications_enabled'] = bool(settings.get('notifications_enabled', 1))
            return settings

        return {
            'work_start': '09:00',
            'work_end': '18:00',
            'reminder_advance': [30, 60],
            'notifications_enabled': True,
            'custom_scenarios': ['work', 'study', 'life', 'side-project', 'social']
        }

    def update_settings(self, updates: dict) -> dict:
        db = get_db()
        cursor = db.cursor()

        if 'reminder_advance' in updates:
            updates['reminder_advance'] = json.dumps(updates['reminder_advance'])
        if 'custom_scenarios' in updates:
            updates['custom_scenarios'] = json.dumps(updates['custom_scenarios'])
        if 'notifications_enabled' in updates:
            updates['notifications_enabled'] = 1 if updates['notifications_enabled'] else 0

        updates['updated_at'] = datetime.now().isoformat()

        set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + ['default']

        cursor.execute(f'UPDATE settings SET {set_clause} WHERE id = ?', values)
        db.commit()

        return self.get_settings()

    def _log_action(self, task_id: str, action: str, old_value: str = None, new_value: str = None):
        db = get_db()
        cursor = db.cursor()

        log_id = str(uuid.uuid4())
        now = datetime.now().isoformat()

        cursor.execute('''
            INSERT INTO task_logs (id, task_id, action, old_value, new_value, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (log_id, task_id, action, old_value, new_value, now))

        db.commit()
