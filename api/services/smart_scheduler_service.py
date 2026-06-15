import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json

DB_PATH = 'tasks.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def parse_datetime(date_str: str) -> Optional[datetime]:
    """安全解析日期时间"""
    if not date_str:
        return None
    try:
        if ' ' in date_str and 'T' not in date_str:
            date_str = date_str.replace(' ', 'T')
        if len(date_str) > 10 and date_str[10] not in ['T', ' ']:
            date_str = date_str[:10] + 'T' + date_str[10:]
        return datetime.fromisoformat(date_str)
    except:
        try:
            if len(date_str) >= 10:
                return datetime.strptime(date_str[:10], '%Y-%m-%d')
        except:
            pass
    return None


def detect_task_conflicts() -> List[Dict]:
    """检测任务时间冲突和重叠"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 获取所有待处理的有截止时间的任务
    cursor.execute('''
        SELECT id, content, priority, deadline, estimated_hours
        FROM tasks
        WHERE status IN ('pending', 'in_progress')
        AND deadline IS NOT NULL
        ORDER BY deadline
    ''')
    
    tasks = []
    for row in cursor.fetchall():
        task = dict(row)
        task['deadline_dt'] = parse_datetime(task['deadline'])
        if task['deadline_dt']:
            tasks.append(task)
    
    conflicts = []
    
    # 检查任务之间的时间冲突
    for i in range(len(tasks)):
        task1 = tasks[i]
        deadline1 = task1['deadline_dt']
        for j in range(i + 1, len(tasks)):
            task2 = tasks[j]
            deadline2 = task2['deadline_dt']
            
            # 计算时间差（小时）
            time_diff_hours = abs((deadline2 - deadline1).total_seconds() / 3600)
            
            # 如果两个任务的截止时间在24小时内，并且都是高优先级，则标记为冲突
            if time_diff_hours <= 24:
                both_high_priority = task1['priority'] in ['urgent', 'high'] and task2['priority'] in ['urgent', 'high']
                
                # 如果有预估时间，检查是否在同一时间段
                has_time_estimates = task1['estimated_hours'] and task2['estimated_hours']
                
                conflicts.append({
                    'type': 'deadline_overlap',
                    'tasks': [
                        {'id': task1['id'], 'content': task1['content'], 'deadline': task1['deadline']},
                        {'id': task2['id'], 'content': task2['content'], 'deadline': task2['deadline']}
                    ],
                    'time_diff_hours': round(time_diff_hours, 1),
                    'both_high_priority': both_high_priority,
                    'severity': 'high' if both_high_priority and time_diff_hours < 6 else 'medium'
                })
    
    conn.close()
    return conflicts


def suggest_task_order() -> List[Dict]:
    """建议任务执行顺序"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, content, priority, deadline, estimated_hours, created_at, status
        FROM tasks
        WHERE status IN ('pending', 'in_progress')
    ''')
    
    tasks = []
    for row in cursor.fetchall():
        task = dict(row)
        task['deadline_dt'] = parse_datetime(task['deadline'])
        tasks.append(task)
    
    # 计算任务优先级分数
    scored_tasks = []
    now = datetime.now()
    
    for task in tasks:
        score = 0
        
        # 优先级权重
        priority_weights = {'urgent': 100, 'high': 70, 'medium': 40, 'low': 10}
        score += priority_weights.get(task['priority'], 30)
        
        # 截止时间权重
        if task['deadline_dt']:
            time_to_deadline = (task['deadline_dt'] - now).total_seconds()
            if time_to_deadline < 0:
                # 已经逾期，加紧急分
                score += 200
            elif time_to_deadline < 3600:  # 1小时内
                score += 150
            elif time_to_deadline < 86400:  # 1天内
                score += 100
            elif time_to_deadline < 259200:  # 3天内
                score += 50
        
        # 任务存在时间权重（存在越久应该优先处理）
        if task['created_at']:
            created_dt = parse_datetime(task['created_at'])
            if created_dt:
                age_days = (now - created_dt).days
                score += min(age_days * 2, 30)  # 最多加30分
        
        task['score'] = score
        scored_tasks.append(task)
    
    # 按分数排序
    scored_tasks.sort(key=lambda x: -x['score'])
    
    # 生成有序的任务建议
    ordered_tasks = []
    for idx, task in enumerate(scored_tasks, 1):
        ordered_tasks.append({
            'order': idx,
            'id': task['id'],
            'content': task['content'],
            'priority': task['priority'],
            'deadline': task['deadline'],
            'reason': _get_task_order_reason(task, idx),
            'score': task['score']
        })
    
    conn.close()
    return ordered_tasks


def _get_task_order_reason(task: Dict, order: int) -> str:
    """生成任务排序原因"""
    reasons = []
    
    if order == 1:
        reasons.append("最优先处理")
    
    priority_reasons = {
        'urgent': "紧急任务",
        'high': "高优先级",
        'medium': "中等优先级",
        'low': "低优先级"
    }
    reasons.append(priority_reasons.get(task['priority'], "普通任务"))
    
    if task['deadline_dt']:
        time_diff = (task['deadline_dt'] - datetime.now()).total_seconds() / 3600
        if time_diff < 0:
            reasons.append(f"已逾期{-time_diff:.1f}小时")
        elif time_diff < 24:
            reasons.append(f"截止时间临近（{time_diff:.1f}小时后）")
        elif time_diff < 72:
            reasons.append("3天内截止")
    
    return " | ".join(reasons)


def dynamic_priority_adjustment(task_id: str) -> Optional[Dict]:
    """动态调整任务优先级"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, content, priority, deadline, created_at, status
        FROM tasks
        WHERE id = ?
    ''', (task_id,))
    
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    
    task = dict(row)
    task['deadline_dt'] = parse_datetime(task['deadline'])
    
    suggestion = None
    now = datetime.now()
    
    if task['deadline_dt']:
        time_to_deadline = (task['deadline_dt'] - now).total_seconds()
        
        # 基于时间因素的优先级调整建议
        if time_to_deadline < 0:
            # 已逾期
            if task['priority'] not in ['urgent', 'high']:
                suggestion = {
                    'current_priority': task['priority'],
                    'suggested_priority': 'urgent',
                    'reason': '任务已逾期，建议升级为紧急优先级'
                }
        elif time_to_deadline < 3600:  # 1小时内
            if task['priority'] == 'medium':
                suggestion = {
                    'current_priority': task['priority'],
                    'suggested_priority': 'high',
                    'reason': '1小时内截止，建议升级为高优先级'
                }
            elif task['priority'] == 'low':
                suggestion = {
                    'current_priority': task['priority'],
                    'suggested_priority': 'urgent',
                    'reason': '1小时内截止，建议升级为紧急优先级'
                }
        elif time_to_deadline < 86400:  # 24小时内
            if task['priority'] == 'low':
                suggestion = {
                    'current_priority': task['priority'],
                    'suggested_priority': 'medium',
                    'reason': '24小时内截止，建议升级为中等优先级'
                }
    
    conn.close()
    return suggestion


def get_all_adjustment_suggestions() -> List[Dict]:
    """获取所有需要调整优先级的任务建议"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id FROM tasks
        WHERE status IN ('pending', 'in_progress')
    ''')
    
    task_ids = [row['id'] for row in cursor.fetchall()]
    conn.close()
    
    suggestions = []
    for task_id in task_ids:
        suggestion = dynamic_priority_adjustment(task_id)
        if suggestion:
            suggestion['id'] = task_id
            suggestions.append(suggestion)
    
    return suggestions


def apply_priority_adjustment(task_id: str, new_priority: str) -> bool:
    """应用优先级调整"""
    valid_priorities = ['urgent', 'high', 'medium', 'low']
    if new_priority not in valid_priorities:
        return False
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE tasks
            SET priority = ?
            WHERE id = ?
        ''', (new_priority, task_id))
        
        conn.commit()
        success = cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating priority: {e}")
        success = False
    finally:
        conn.close()
    
    return success


def get_schedule_insights() -> Dict:
    """获取完整的调度分析"""
    conflicts = detect_task_conflicts()
    ordered_tasks = suggest_task_order()
    adjustment_suggestions = get_all_adjustment_suggestions()
    
    return {
        'conflicts': conflicts,
        'suggested_order': ordered_tasks,
        'priority_adjustments': adjustment_suggestions,
        'summary': {
            'total_conflicts': len(conflicts),
            'high_severity_conflicts': len([c for c in conflicts if c['severity'] == 'high']),
            'pending_tasks': len(ordered_tasks),
            'priority_suggestions_count': len(adjustment_suggestions)
        }
    }
