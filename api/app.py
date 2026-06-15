import os
import sys
import sqlite3
from flask import Flask, jsonify, g
from flask_cors import CORS
from datetime import datetime
import traceback

app = Flask(__name__)
CORS(app)

app.config['DATABASE'] = os.path.join(os.path.dirname(__file__), 'tasks.db')

def get_db():
    """获取数据库连接 - 每个请求创建新连接"""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(
            app.config['DATABASE'],
            timeout=30,
            check_same_thread=False
        )
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_db(exception):
    """请求结束时关闭数据库连接"""
    db = g.pop('_database', None)
    if db is not None:
        db.close()

def init_db():
    """初始化数据库表结构"""
    with app.app_context():
        db = get_db()
        cursor = db.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                deadline TEXT,
                estimated_hours REAL DEFAULT 0,
                priority TEXT DEFAULT 'medium',
                scenario TEXT DEFAULT 'general',
                status TEXT DEFAULT 'pending',
                parent_id TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                completed_at TEXT,
                FOREIGN KEY (parent_id) REFERENCES tasks(id)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS subtasks (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                content TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                estimated_hours REAL DEFAULT 0.5,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS task_logs (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                action TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                period_type TEXT NOT NULL,
                period_start TEXT NOT NULL,
                period_end TEXT NOT NULL,
                stats TEXT,
                analysis TEXT,
                suggestions TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                id TEXT PRIMARY KEY DEFAULT 'default',
                work_start TEXT DEFAULT '09:00',
                work_end TEXT DEFAULT '18:00',
                reminder_advance TEXT DEFAULT '[30, 60]',
                notifications_enabled INTEGER DEFAULT 1,
                custom_scenarios TEXT DEFAULT '["work","study","life","side-project","social"]',
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tags (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                color TEXT DEFAULT '#6366f1',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS task_tags (
                task_id TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                PRIMARY KEY (task_id, tag_id),
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT DEFAULT 'folder',
                color TEXT DEFAULT '#6366f1',
                sort_order INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS time_logs (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS task_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                content TEXT NOT NULL,
                priority TEXT DEFAULT 'medium',
                estimated_hours REAL DEFAULT 1.0,
                tags TEXT,
                icon TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recurring_tasks (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                priority TEXT DEFAULT 'medium',
                recurrence_rule TEXT NOT NULL,
                start_date TEXT,
                end_date TEXT,
                last_generated TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_conversations (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at TEXT,
                updated_at TEXT,
                pinned INTEGER DEFAULT 0
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT,
                role TEXT,
                content TEXT,
                created_at TEXT,
                FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
            )
        ''')

        cursor.execute("SELECT COUNT(*) FROM settings WHERE id = 'default'")
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
                INSERT INTO settings (id, work_start, work_end, reminder_advance, notifications_enabled, custom_scenarios)
                VALUES ('default', '09:00', '18:00', '[30, 60]', 1, '["work","study","life","side-project","social"]')
            ''')

        db.commit()
        print("✓ 数据库初始化完成")

from services.nlu_service import NLUService
from services.task_service import TaskService
from services.schedule_service import ScheduleService
from services.review_service import ReviewService
import services.recurring_service as recurring_service
import services.template_service as template_service
import services.analytics_service as analytics_service
import services.notification_service as notification_service
from services.ai_assistant_service import AIAssistantService
from services.smart_scheduler_service import get_schedule_insights, apply_priority_adjustment
from services.enhanced_analytics_service import get_personalized_insights
from services.backup_sync_service import BackupManager, get_backup_summary

nlu_service = NLUService()
task_service = TaskService()
schedule_service = ScheduleService()
review_service = ReviewService()
ai_assistant_service = AIAssistantService()
backup_manager = BackupManager()

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    try:
        tasks = task_service.get_all_tasks()
        return jsonify({'success': True, 'data': tasks})
    except Exception as e:
        print(f"Error in get_tasks: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def create_task():
    try:
        from flask import request
        data = request.get_json()
        input_text = data.get('input', '')

        parsed = nlu_service.parse_task(input_text)
        task = task_service.create_task(parsed)

        return jsonify({'success': True, 'data': task})
    except Exception as e:
        print(f"Error in create_task: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['GET'])
def get_task(task_id):
    try:
        task = task_service.get_task(task_id)
        if task:
            return jsonify({'success': True, 'data': task})
        return jsonify({'success': False, 'error': 'Task not found'}), 404
    except Exception as e:
        print(f"Error in get_task: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    try:
        from flask import request
        data = request.get_json()
        task = task_service.update_task(task_id, data)
        if task:
            return jsonify({'success': True, 'data': task})
        return jsonify({'success': False, 'error': 'Task not found'}), 404
    except Exception as e:
        print(f"Error in update_task: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        success = task_service.delete_task(task_id)
        return jsonify({'success': success})
    except Exception as e:
        print(f"Error in delete_task: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/status', methods=['PATCH'])
def update_task_status(task_id):
    try:
        from flask import request
        data = request.get_json()
        status = data.get('status')
        task = task_service.update_task_status(task_id, status)
        if task:
            return jsonify({'success': True, 'data': task})
        return jsonify({'success': False, 'error': 'Task not found'}), 404
    except Exception as e:
        print(f"Error in update_task_status: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/split', methods=['POST'])
def split_task(task_id):
    try:
        subtasks = nlu_service.split_task(task_service.get_task(task_id))
        if subtasks:
            for sub in subtasks:
                task_service.create_subtask(task_id, sub)
            return jsonify({'success': True, 'data': {'subtasks': subtasks}})
        return jsonify({'success': False, 'error': 'Failed to split task'}), 400
    except Exception as e:
        print(f"Error in split_task: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/subtasks/<subtask_id>', methods=['PATCH'])
def update_subtask_status(subtask_id):
    try:
        from flask import request
        data = request.get_json()
        completed = data.get('completed', False)
        print(f"Updating subtask {subtask_id} to completed={completed}")

        subtask = task_service.update_subtask_status(subtask_id, completed)

        if subtask:
            print(f"Subtask updated successfully: {subtask}")
            return jsonify({'success': True, 'data': subtask})

        print(f"Subtask not found: {subtask_id}")
        return jsonify({'success': False, 'error': 'Subtask not found'}), 404
    except Exception as e:
        print(f"Error in update_subtask_status: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/subtasks/<subtask_id>', methods=['DELETE'])
def delete_subtask(subtask_id):
    try:
        success = task_service.delete_subtask(subtask_id)
        return jsonify({'success': success})
    except Exception as e:
        print(f"Error in delete_subtask: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    try:
        from flask import request
        start = request.args.get('start')
        end = request.args.get('end')
        schedule = schedule_service.get_schedule(start, end)
        return jsonify({'success': True, 'data': schedule})
    except Exception as e:
        print(f"Error in get_schedule: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/schedule/optimize', methods=['POST'])
def optimize_schedule():
    try:
        result = schedule_service.optimize_schedule()
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        print(f"Error in optimize_schedule: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/review/daily', methods=['GET'])
def get_daily_review():
    try:
        review = review_service.get_daily_review()
        return jsonify({'success': True, 'data': review})
    except Exception as e:
        print(f"Error in get_daily_review: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/review/weekly', methods=['GET'])
def get_weekly_review():
    try:
        review = review_service.get_weekly_review()
        return jsonify({'success': True, 'data': review})
    except Exception as e:
        print(f"Error in get_weekly_review: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/settings', methods=['GET'])
def get_settings():
    try:
        settings = task_service.get_settings()
        return jsonify({'success': True, 'data': settings})
    except Exception as e:
        print(f"Error in get_settings: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    try:
        from flask import request
        data = request.get_json()
        settings = task_service.update_settings(data)
        return jsonify({'success': True, 'data': settings})
    except Exception as e:
        print(f"Error in update_settings: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tags', methods=['GET'])
def get_tags():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM tags ORDER BY name')
        tags = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': tags})
    except Exception as e:
        print(f"Error in get_tags: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tags', methods=['POST'])
def create_tag():
    try:
        from flask import request
        import uuid
        data = request.get_json()
        tag_id = str(uuid.uuid4())
        name = data.get('name', '').strip()
        color = data.get('color', '#6366f1')
        
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO tags (id, name, color) VALUES (?, ?, ?)',
            (tag_id, name, color)
        )
        db.commit()
        
        cursor.execute('SELECT * FROM tags WHERE id = ?', (tag_id,))
        tag = dict(cursor.fetchone())
        return jsonify({'success': True, 'data': tag})
    except Exception as e:
        print(f"Error in create_tag: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tags/<tag_id>', methods=['PUT'])
def update_tag(tag_id):
    try:
        from flask import request
        data = request.get_json()
        
        db = get_db()
        cursor = db.cursor()
        
        updates = []
        params = []
        if 'name' in data:
            updates.append('name = ?')
            params.append(data['name'])
        if 'color' in data:
            updates.append('color = ?')
            params.append(data['color'])
        
        if updates:
            params.append(tag_id)
            cursor.execute(f"UPDATE tags SET {', '.join(updates)} WHERE id = ?", params)
            db.commit()
        
        cursor.execute('SELECT * FROM tags WHERE id = ?', (tag_id,))
        tag = cursor.fetchone()
        if tag:
            return jsonify({'success': True, 'data': dict(tag)})
        return jsonify({'success': False, 'error': 'Tag not found'}), 404
    except Exception as e:
        print(f"Error in update_tag: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tags/<tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('DELETE FROM tags WHERE id = ?', (tag_id,))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in delete_tag: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/tags', methods=['GET'])
def get_task_tags(task_id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT t.* FROM tags t
            INNER JOIN task_tags tt ON t.id = tt.tag_id
            WHERE tt.task_id = ?
        ''', (task_id,))
        tags = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': tags})
    except Exception as e:
        print(f"Error in get_task_tags: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/tags', methods=['POST'])
def add_task_tag(task_id):
    try:
        from flask import request
        data = request.get_json()
        tag_id = data.get('tag_id')
        
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)',
            (task_id, tag_id)
        )
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in add_task_tag: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/tags/<tag_id>', methods=['DELETE'])
def remove_task_tag(task_id, tag_id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?', (task_id, tag_id))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in remove_task_tag: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM categories ORDER BY sort_order, name')
        categories = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': categories})
    except Exception as e:
        print(f"Error in get_categories: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories', methods=['POST'])
def create_category():
    try:
        from flask import request
        import uuid
        data = request.get_json()
        category_id = str(uuid.uuid4())
        name = data.get('name', '').strip()
        icon = data.get('icon', 'folder')
        color = data.get('color', '#6366f1')
        
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)',
            (category_id, name, icon, color)
        )
        db.commit()
        
        cursor.execute('SELECT * FROM categories WHERE id = ?', (category_id,))
        category = dict(cursor.fetchone())
        return jsonify({'success': True, 'data': category})
    except Exception as e:
        print(f"Error in create_category: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories/<category_id>', methods=['PUT'])
def update_category(category_id):
    try:
        from flask import request
        data = request.get_json()
        
        db = get_db()
        cursor = db.cursor()
        
        updates = []
        params = []
        if 'name' in data:
            updates.append('name = ?')
            params.append(data['name'])
        if 'icon' in data:
            updates.append('icon = ?')
            params.append(data['icon'])
        if 'color' in data:
            updates.append('color = ?')
            params.append(data['color'])
        if 'sort_order' in data:
            updates.append('sort_order = ?')
            params.append(data['sort_order'])
        
        if updates:
            params.append(category_id)
            cursor.execute(f"UPDATE categories SET {', '.join(updates)} WHERE id = ?", params)
            db.commit()
        
        cursor.execute('SELECT * FROM categories WHERE id = ?', (category_id,))
        category = cursor.fetchone()
        if category:
            return jsonify({'success': True, 'data': dict(category)})
        return jsonify({'success': False, 'error': 'Category not found'}), 404
    except Exception as e:
        print(f"Error in update_category: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories/<category_id>', methods=['DELETE'])
def delete_category(category_id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('DELETE FROM categories WHERE id = ?', (category_id,))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in delete_category: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/time-logs', methods=['GET'])
def get_task_time_logs(task_id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT * FROM time_logs 
            WHERE task_id = ? 
            ORDER BY start_time DESC
        ''', (task_id,))
        logs = [dict(row) for row in cursor.fetchall()]
        return jsonify({'success': True, 'data': logs})
    except Exception as e:
        print(f"Error in get_task_time_logs: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/time-start', methods=['POST'])
def start_time_tracking(task_id):
    try:
        import uuid
        from datetime import datetime
        
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('SELECT * FROM time_logs WHERE task_id = ? AND end_time IS NULL', (task_id,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Time tracking already in progress'}), 400
        
        log_id = str(uuid.uuid4())
        start_time = datetime.now().isoformat()
        
        cursor.execute(
            'INSERT INTO time_logs (id, task_id, start_time) VALUES (?, ?, ?)',
            (log_id, task_id, start_time)
        )
        db.commit()
        
        cursor.execute('SELECT * FROM time_logs WHERE id = ?', (log_id,))
        log = dict(cursor.fetchone())
        return jsonify({'success': True, 'data': log})
    except Exception as e:
        print(f"Error in start_time_tracking: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/time-stop', methods=['POST'])
def stop_time_tracking(task_id):
    try:
        from datetime import datetime
        
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('SELECT * FROM time_logs WHERE task_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1', (task_id,))
        log = cursor.fetchone()
        
        if not log:
            return jsonify({'success': False, 'error': 'No active time tracking found'}), 400
        
        end_time = datetime.now()
        start_time = datetime.fromisoformat(dict(log)['start_time'])
        duration = int((end_time - start_time).total_seconds())
        
        cursor.execute(
            'UPDATE time_logs SET end_time = ?, duration = ? WHERE id = ?',
            (end_time.isoformat(), duration, dict(log)['id'])
        )
        db.commit()
        
        cursor.execute('SELECT * FROM time_logs WHERE id = ?', (dict(log)['id'],))
        updated_log = dict(cursor.fetchone())
        return jsonify({'success': True, 'data': updated_log})
    except Exception as e:
        print(f"Error in stop_time_tracking: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/time-logs/<log_id>', methods=['DELETE'])
def delete_time_log(log_id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('DELETE FROM time_logs WHERE id = ?', (log_id,))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in delete_time_log: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/reorder', methods=['POST'])
def reorder_tasks():
    try:
        from flask import request
        data = request.get_json()
        task_orders = data.get('orders', [])
        
        db = get_db()
        cursor = db.cursor()
        
        for order_data in task_orders:
            task_id = order_data.get('id')
            sort_order = order_data.get('sort_order', 0)
            cursor.execute('UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', (task_id,))
        
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in reorder_tasks: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/statistics/productivity', methods=['GET'])
def get_productivity_stats():
    try:
        from flask import request
        days = int(request.args.get('days', 7))
        
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            SELECT 
                COUNT(*) as total_completed,
                SUM(duration) as total_duration,
                AVG(duration) as avg_duration
            FROM time_logs
            WHERE created_at >= datetime('now', '-' || ? || ' days')
        ''', (days,))
        time_stats = dict(cursor.fetchone())
        
        cursor.execute('''
            SELECT 
                COUNT(*) as completed_tasks
            FROM tasks
            WHERE completed_at >= datetime('now', '-' || ? || ' days')
        ''', (days,))
        task_stats = dict(cursor.fetchone())
        
        cursor.execute('''
            SELECT 
                strftime('%Y-%m-%d', completed_at) as date,
                COUNT(*) as count
            FROM tasks
            WHERE completed_at >= datetime('now', '-' || ? || ' days')
            GROUP BY strftime('%Y-%m-%d', completed_at)
            ORDER BY date
        ''', (days,))
        daily_stats = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            'success': True, 
            'data': {
                'time_stats': time_stats,
                'task_stats': task_stats,
                'daily_stats': daily_stats
            }
        })
    except Exception as e:
        print(f"Error in get_productivity_stats: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recurring-tasks', methods=['GET'])
def get_recurring_tasks():
    try:
        tasks = recurring_service.get_all_recurring_tasks()
        return jsonify({'success': True, 'data': tasks})
    except Exception as e:
        print(f"Error in get_recurring_tasks: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recurring-tasks', methods=['POST'])
def create_recurring_task_api():
    try:
        from flask import request
        data = request.get_json()
        task = recurring_service.create_recurring_task(
            content=data.get('content', ''),
            priority=data.get('priority', 'medium'),
            recurrence_rule=data.get('recurrence_rule', 'daily 1'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date')
        )
        return jsonify({'success': True, 'data': task})
    except Exception as e:
        print(f"Error in create_recurring_task_api: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recurring-tasks/<task_id>', methods=['PUT'])
def update_recurring_task_api(task_id):
    try:
        from flask import request
        data = request.get_json()
        task = recurring_service.update_recurring_task(task_id, data)
        if task:
            return jsonify({'success': True, 'data': task})
        return jsonify({'success': False, 'error': 'Not found'}), 404
    except Exception as e:
        print(f"Error in update_recurring_task_api: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recurring-tasks/<task_id>', methods=['DELETE'])
def delete_recurring_task_api(task_id):
    try:
        success = recurring_service.delete_recurring_task(task_id)
        return jsonify({'success': success})
    except Exception as e:
        print(f"Error in delete_recurring_task_api: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/recurring-tasks/generate', methods=['POST'])
def generate_recurring_tasks():
    try:
        tasks = recurring_service.generate_tasks_from_recurring()
        return jsonify({'success': True, 'data': tasks})
    except Exception as e:
        print(f"Error in generate_recurring_tasks: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/templates', methods=['GET'])
def get_templates():
    try:
        templates = template_service.get_all_templates()
        return jsonify({'success': True, 'data': templates})
    except Exception as e:
        print(f"Error in get_templates: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/templates', methods=['POST'])
def create_template_api():
    try:
        from flask import request
        data = request.get_json()
        template = template_service.create_template(
            name=data.get('name', ''),
            content=data.get('content', ''),
            description=data.get('description'),
            priority=data.get('priority', 'medium'),
            estimated_hours=data.get('estimated_hours', 1),
            tags=data.get('tags'),
            icon=data.get('icon')
        )
        return jsonify({'success': True, 'data': template})
    except Exception as e:
        print(f"Error in create_template_api: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/templates/<template_id>', methods=['PUT'])
def update_template_api(template_id):
    try:
        from flask import request
        data = request.get_json()
        template = template_service.update_template(template_id, data)
        if template:
            return jsonify({'success': True, 'data': template})
        return jsonify({'success': False, 'error': 'Not found'}), 404
    except Exception as e:
        print(f"Error in update_template_api: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/templates/<template_id>', methods=['DELETE'])
def delete_template_api(template_id):
    try:
        success = template_service.delete_template(template_id)
        return jsonify({'success': success})
    except Exception as e:
        print(f"Error in delete_template_api: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/templates/<template_id>/use', methods=['POST'])
def use_template_api(template_id):
    try:
        from flask import request
        data = request.get_json() or {}
        task = template_service.use_template(template_id, data.get('scheduled_at'))
        if task:
            return jsonify({'success': True, 'data': task})
        return jsonify({'success': False, 'error': 'Template not found'}), 404
    except Exception as e:
        print(f"Error in use_template_api: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/procrastination', methods=['GET'])
def get_procrastination():
    try:
        patterns = analytics_service.detect_procrastination_patterns()
        return jsonify({'success': True, 'data': patterns})
    except Exception as e:
        print(f"Error in get_procrastination: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/time-accuracy', methods=['GET'])
def get_time_accuracy():
    try:
        from flask import request
        days = int(request.args.get('days', 30))
        data = analytics_service.get_estimated_time_accuracy(days)
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        print(f"Error in get_time_accuracy: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/insights', methods=['GET'])
def get_insights():
    try:
        from flask import request
        days = int(request.args.get('days', 30))
        insights = analytics_service.get_productivity_insights(days)
        recommendations = analytics_service.get_recommendations()
        return jsonify({
            'success': True, 
            'data': {
                'insights': insights,
                'recommendations': recommendations
            }
        })
    except Exception as e:
        print(f"Error in get_insights: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/old-tasks', methods=['GET'])
def get_old_tasks():
    try:
        from flask import request
        days = int(request.args.get('days', 90))
        old_tasks = analytics_service.get_old_tasks(days)
        return jsonify({'success': True, 'data': old_tasks})
    except Exception as e:
        print(f"Error in get_old_tasks: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/batch-reschedule', methods=['POST'])
def batch_reschedule_tasks():
    try:
        from flask import request
        data = request.get_json()
        task_ids = data.get('task_ids', [])
        new_deadline = data.get('deadline')
        
        db = get_db()
        cursor = db.cursor()
        
        updated_tasks = []
        for task_id in task_ids:
            cursor.execute('''
                UPDATE tasks 
                SET deadline = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (new_deadline, task_id))
            
            cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
            row = cursor.fetchone()
            if row:
                updated_tasks.append(dict(row))
        
        db.commit()
        return jsonify({'success': True, 'data': updated_tasks})
    except Exception as e:
        print(f"Error in batch_reschedule_tasks: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/analytics/trends', methods=['GET'])
def get_procrastination_trends():
    try:
        from flask import request
        days = int(request.args.get('days', 30))
        trends = analytics_service.get_procrastination_trends(days)
        return jsonify({'success': True, 'data': trends})
    except Exception as e:
        print(f"Error in get_procrastination_trends: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/batch', methods=['PUT'])
def batch_update_tasks():
    try:
        from flask import request
        data = request.get_json()
        task_ids = data.get('task_ids', [])
        updates = data.get('updates', {})
        
        for task_id in task_ids:
            task_service.update_task(task_id, updates)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in batch_update_tasks: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/batch', methods=['DELETE'])
def batch_delete_tasks():
    try:
        from flask import request
        data = request.get_json()
        task_ids = data.get('task_ids', [])
        
        for task_id in task_ids:
            task_service.delete_task(task_id)
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in batch_delete_tasks: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    try:
        import csv
        from io import StringIO
        from flask import make_response
        
        tasks = task_service.get_all_tasks()
        
        si = StringIO()
        cw = csv.writer(si)
        cw.writerow(['ID', 'Content', 'Priority', 'Status', 'Created At', 'Completed At'])
        for task in tasks:
            cw.writerow([
                task['id'],
                task['content'],
                task.get('priority', ''),
                task.get('status', ''),
                task.get('created_at', ''),
                task.get('completed_at', '')
            ])
        
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=tasks.csv"
        output.headers["Content-type"] = "text/csv"
        return output
    except Exception as e:
        print(f"Error in export_csv: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/backups', methods=['GET'])
def list_backups():
    try:
        backups = notification_service.list_backups()
        return jsonify({'success': True, 'data': backups})
    except Exception as e:
        print(f"Error in list_backups: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/backups', methods=['POST'])
def create_backup():
    try:
        from flask import request
        data = request.get_json() or {}
        backup = notification_service.create_backup(data.get('name'))
        return jsonify({'success': True, 'data': backup})
    except Exception as e:
        print(f"Error in create_backup: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/backups/<backup_id>', methods=['POST'])
def restore_backup_api(backup_id):
    try:
        success = notification_service.restore_backup(backup_id)
        return jsonify({'success': success})
    except Exception as e:
        print(f"Error in restore_backup_api: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/backups/<backup_id>', methods=['DELETE'])
def delete_backup_api(backup_id):
    try:
        success = notification_service.delete_backup(backup_id)
        return jsonify({'success': success})
    except Exception as e:
        print(f"Error in delete_backup_api: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/conversations', methods=['GET'])
def get_chat_conversations():
    try:
        conversations = ai_assistant_service.get_all_conversations()
        return jsonify({'success': True, 'data': conversations})
    except Exception as e:
        print(f"Error in get_chat_conversations: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/conversations', methods=['POST'])
def create_chat_conversation():
    try:
        from flask import request
        data = request.get_json() or {}
        title = data.get('title', '新对话')
        conversation = ai_assistant_service.create_conversation(title)
        return jsonify({'success': True, 'data': conversation})
    except Exception as e:
        print(f"Error in create_chat_conversation: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/conversations/<conversation_id>', methods=['GET'])
def get_chat_conversation(conversation_id):
    try:
        conversation = ai_assistant_service.get_conversation(conversation_id)
        if conversation:
            return jsonify({'success': True, 'data': conversation})
        return jsonify({'success': False, 'error': 'Conversation not found'}), 404
    except Exception as e:
        print(f"Error in get_chat_conversation: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/conversations/<conversation_id>', methods=['DELETE'])
def delete_chat_conversation(conversation_id):
    try:
        success = ai_assistant_service.delete_conversation(conversation_id)
        return jsonify({'success': success})
    except Exception as e:
        print(f"Error in delete_chat_conversation: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/conversations/<conversation_id>/messages', methods=['POST'])
def send_chat_message(conversation_id):
    try:
        from flask import request
        data = request.get_json()
        user_message = data.get('message', '')
        
        # 添加用户消息
        ai_assistant_service.add_message(conversation_id, 'user', user_message)
        
        # 获取AI响应
        ai_response = ai_assistant_service.generate_ai_response(conversation_id, user_message)
        
        # 添加AI响应
        conversation = ai_assistant_service.add_message(conversation_id, 'assistant', ai_response)
        
        return jsonify({'success': True, 'data': conversation})
    except Exception as e:
        print(f"Error in send_chat_message: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat/quick-task', methods=['POST'])
def quick_create_task():
    try:
        from flask import request
        data = request.get_json()
        prompt = data.get('prompt', '')
        
        # 使用AI生成任务
        conversation = ai_assistant_service.create_conversation('快速任务创建')
        ai_assistant_service.add_message(conversation['id'], 'user', f"帮我创建任务：{prompt}")
        ai_response = ai_assistant_service.generate_ai_response(conversation['id'], f"帮我创建任务：{prompt}")
        
        return jsonify({'success': True, 'data': {'response': ai_response}})
    except Exception as e:
        print(f"Error in quick_create_task: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/smart-scheduler/insights', methods=['GET'])
def smart_scheduler_insights():
    try:
        insights = get_schedule_insights()
        return jsonify({'success': True, 'data': insights})
    except Exception as e:
        print(f"Error in schedule_insights: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/smart-scheduler/adjust-priority', methods=['POST'])
def smart_adjust_priority():
    try:
        from flask import request
        data = request.get_json()
        task_id = data.get('task_id')
        new_priority = data.get('priority')
        
        success = apply_priority_adjustment(task_id, new_priority)
        return jsonify({'success': success})
    except Exception as e:
        print(f"Error in adjust_priority: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/enhanced-analytics/personalized', methods=['GET'])
def enhanced_personalized_analytics():
    try:
        insights = get_personalized_insights()
        return jsonify({'success': True, 'data': insights})
    except Exception as e:
        print(f"Error in personalized_analytics: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/backup-sync/create', methods=['POST'])
def backup_sync_create():
    try:
        from flask import request
        data = request.get_json() or {}
        encrypt = data.get('encrypt', False)
        
        result = backup_manager.create_backup(encrypt=encrypt)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        print(f"Error in create_new_backup: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/backup-sync/list', methods=['GET'])
def backup_sync_list():
    try:
        result = get_backup_summary()
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        print(f"Error in list_backups: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/backup-sync/restore', methods=['POST'])
def backup_sync_restore():
    try:
        from flask import request
        data = request.get_json()
        filename = data.get('filename')
        
        result = backup_manager.restore_backup(filename)
        return jsonify(result)
    except Exception as e:
        print(f"Error in restore_backup: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/backup/delete', methods=['POST'])
def delete_backup_route():
    try:
        from flask import request
        data = request.get_json()
        filename = data.get('filename')
        
        success = backup_manager.delete_backup(filename)
        return jsonify({'success': success})
    except Exception as e:
        print(f"Error in delete_backup: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'AI任务管家服务运行中'})

if __name__ == '__main__':
    init_db()
    print("\n" + "="*50)
    print("  🚀 AI任务管家后端服务启动中...")
    print("  📍 地址: http://localhost:5000")
    print("  📖 API文档: http://localhost:5000/api/health")
    print("="*50 + "\n")
    app.run(debug=False, host='0.0.0.0', port=5000)
