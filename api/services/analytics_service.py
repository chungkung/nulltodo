import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional

DB_PATH = 'tasks.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_task_statistics() -> Dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) as total FROM tasks')
    total = cursor.fetchone()['total']
    
    cursor.execute("SELECT COUNT(*) as completed FROM tasks WHERE status = 'completed'")
    completed = cursor.fetchone()['completed']
    
    cursor.execute('''
        SELECT priority, COUNT(*) as count 
        FROM tasks 
        GROUP BY priority
    ''')
    priority_stats = {row['priority']: row['count'] for row in cursor.fetchall()}
    
    cursor.execute('''
        SELECT status, COUNT(*) as count 
        FROM tasks 
        GROUP BY status
    ''')
    status_stats = {row['status']: row['count'] for row in cursor.fetchall()}
    
    conn.close()
    
    return {
        'total': total,
        'completed': completed,
        'completion_rate': completed / total if total > 0 else 0,
        'by_priority': priority_stats,
        'by_status': status_stats
    }

def detect_procrastination_patterns() -> List[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            id,
            content,
            priority,
            created_at,
            deadline,
            completed_at
        FROM tasks 
        WHERE status IN ('pending', 'overdue') 
        AND deadline IS NOT NULL
        AND deadline < ?
    ''', (datetime.now().isoformat(),))
    
    overdue_tasks = cursor.fetchall()
    patterns = []
    
    for task in overdue_tasks:
        task_dict = dict(task)
        if task_dict['deadline']:
            try:
                deadline_str = task_dict['deadline']
                # 更加灵活的日期解析
                if ' ' in deadline_str and 'T' not in deadline_str:
                    deadline_str = deadline_str.replace(' ', 'T')
                # 处理缺失日期分隔符的情况
                if len(deadline_str) > 10 and deadline_str[10] not in ['T', ' ']:
                    deadline_str = deadline_str[:10] + 'T' + deadline_str[10:]
                # 简化处理：直接尝试各种可能的格式
                due = None
                try:
                    due = datetime.fromisoformat(deadline_str)
                except:
                    # 尝试简化的日期格式
                    try:
                        # 仅日期部分 (YYYY-MM-DD)
                        if len(deadline_str) >= 10:
                            due = datetime.strptime(deadline_str[:10], '%Y-%m-%d')
                    except:
                        pass
                
                if due:
                    delay_days = (datetime.now() - due).days
                    # 设置拖延严重程度
                    if delay_days <= 0:
                        severity = 'normal'
                    elif delay_days < 3:
                        severity = 'mild'
                    elif delay_days < 7:
                        severity = 'moderate'
                    elif delay_days < 30:
                        severity = 'severe'
                    else:
                        severity = 'critical'
                    
                    task_dict['delay_days'] = delay_days
                    task_dict['due_date'] = task_dict['deadline']
                    task_dict['severity'] = severity
                    patterns.append(task_dict)
            except Exception as e:
                print(f"Error parsing date for task {task_dict.get('id')}: {e}")
    
    # 按优先级和拖延天数排序
    priority_order = {'urgent': 0, 'high': 1, 'medium': 2, 'low': 3}
    patterns.sort(key=lambda x: (
        priority_order.get(x.get('priority', 'medium'), 2),
        -x.get('delay_days', 0)
    ))
    
    conn.close()
    return patterns

def get_estimated_time_accuracy(days: int = 30) -> Dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    since = (datetime.now() - timedelta(days=days)).isoformat()
    
    cursor.execute('''
        SELECT 
            t.content,
            t.estimated_hours,
            COALESCE(SUM(tl.duration), 0) as actual_hours
        FROM tasks t
        LEFT JOIN time_logs tl ON t.id = tl.task_id
        WHERE t.status = 'completed'
        AND t.completed_at > ?
        AND t.estimated_hours IS NOT NULL
        GROUP BY t.id
    ''', (since,))
    
    tasks = cursor.fetchall()
    conn.close()
    
    accuracies = []
    for task in tasks:
        estimated = task['estimated_hours']
        actual = task['actual_hours'] / 3600 if task['actual_hours'] else 0
        if estimated > 0:
            error_rate = abs(actual - estimated) / estimated
            accuracies.append({
                'content': task['content'],
                'estimated': estimated,
                'actual': actual,
                'error_rate': error_rate
            })
    
    avg_error = sum(a['error_rate'] for a in accuracies) / len(accuracies) if accuracies else 0
    
    return {
        'samples': len(accuracies),
        'avg_error_rate': avg_error,
        'tasks': accuracies
    }

def get_productivity_insights(days: int = 30) -> Dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    since = (datetime.now() - timedelta(days=days)).isoformat()
    
    cursor.execute('''
        SELECT 
            strftime('%Y-%m-%d', completed_at) as date,
            COUNT(*) as completed_count
        FROM tasks 
        WHERE status = 'completed' AND completed_at > ?
        GROUP BY strftime('%Y-%m-%d', completed_at)
        ORDER BY date
    ''', (since,))
    
    daily_completed = cursor.fetchall()
    
    cursor.execute('''
        SELECT 
            priority,
            COUNT(*) as count
        FROM tasks 
        WHERE status = 'completed' AND completed_at > ?
        GROUP BY priority
    ''', (since,))
    
    by_priority = cursor.fetchall()
    
    conn.close()
    
    best_day = None
    max_count = 0
    for row in daily_completed:
        if row['completed_count'] > max_count:
            max_count = row['completed_count']
            best_day = row['date']
    
    return {
        'daily_completed': [dict(row) for row in daily_completed],
        'by_priority': {row['priority']: row['count'] for row in by_priority},
        'best_day': best_day,
        'max_daily_completed': max_count
    }

def get_old_tasks(days_threshold: int = 90) -> List[Dict]:
    """获取超过指定天数的旧任务"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cutoff_date = (datetime.now() - timedelta(days=days_threshold)).isoformat()
    
    cursor.execute('''
        SELECT 
            id,
            content,
            priority,
            created_at,
            deadline,
            status
        FROM tasks 
        WHERE status IN ('pending', 'overdue')
        AND created_at < ?
        ORDER BY created_at ASC
    ''', (cutoff_date,))
    
    old_tasks = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    for task in old_tasks:
        if task['created_at']:
            try:
                created = datetime.fromisoformat(task['created_at'])
                task['age_days'] = (datetime.now() - created).days
            except:
                task['age_days'] = 0
    
    return old_tasks

def get_procrastination_trends(days: int = 30) -> List[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    trends = []
    
    # 过去30天，每天统计逾期任务数
    today = datetime.now()
    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        date_str = date.strftime('%Y-%m-%d')
        
        # 查询当天结束时的逾期任务
        cursor.execute('''
            SELECT COUNT(*) FROM tasks
            WHERE status IN ('pending', 'overdue')
            AND deadline < ?
        ''', (date_str + ' 23:59:59',))
        
        count = cursor.fetchone()[0]
        trends.append({
            'date': date_str,
            'count': count
        })
    
    conn.close()
    return trends


def get_recommendations() -> List[str]:
    recommendations = []
    
    stats = get_task_statistics()
    procrastination = detect_procrastination_patterns()
    insights = get_productivity_insights(days=30)
    old_tasks = get_old_tasks()
    
    # 1. 完成率分析
    completion_rate = stats.get('completion_rate', 0)
    if completion_rate < 0.3:
        recommendations.append("⚠️ 你的完成率非常低！建议先清理待办清单，只保留最重要的2-3个任务")
    elif completion_rate < 0.5:
        recommendations.append("📉 你本周的完成率偏低，建议减少任务数量，每次专注于1个任务")
    elif completion_rate < 0.8:
        recommendations.append("✓ 你的完成率还不错，可以尝试适当增加一些挑战")
    
    # 2. 拖延分析
    if procrastination:
        critical_count = len([t for t in procrastination if t.get('severity') in ['critical', 'severe']])
        if critical_count > 0:
            recommendations.append(f"🚨 有 {critical_count} 个严重逾期的任务，建议立即处理！")
        
        high_priority_overdue = [t for t in procrastination if t.get('priority') in ['urgent', 'high']]
        if high_priority_overdue:
            recommendations.append(f"⏰ 有 {len(high_priority_overdue)} 个高优先级任务逾期，请优先处理")
        
        # 最久的拖延
        if procrastination:
            oldest = max(procrastination, key=lambda x: x.get('delay_days', 0))
            recommendations.append(f"📅 最久的任务已拖延 {oldest.get('delay_days')} 天，建议重新评估其必要性")
    
    # 3. 旧任务分析
    if len(old_tasks) > 0:
        recommendations.append(f"🗑️ 发现 {len(old_tasks)} 个超过90天的旧任务，建议清理")
    
    # 4. 效率洞察
    if insights.get('best_day'):
        recommendations.append(f"📈 你的最佳效率日是 {insights['best_day']}，建议在这天安排最重要的任务")
    
    if insights.get('max_daily_completed', 0) > 5:
        recommendations.append(f"🎯 你曾在一天内完成 {insights['max_daily_completed']} 个任务！可以参考那天的节奏")
    
    # 5. 时间预估准确度
    time_accuracy = get_estimated_time_accuracy()
    if time_accuracy.get('avg_error_rate', 0) > 0.7:
        recommendations.append("⏱️ 你的时间预估偏差很大！建议将预估时间乘以2")
    elif time_accuracy.get('avg_error_rate', 0) > 0.4:
        recommendations.append("⏱️ 你的时间预估有一定偏差，建议增加30%的缓冲时间")
    
    # 6. 积极反馈
    if not recommendations:
        recommendations.append("🎉 太棒了！你的任务管理状态非常良好，继续保持！")
    
    # 7. 通用建议（如果没有太多特定建议）
    if len(recommendations) < 3:
        recommendations.append("💡 尝试使用番茄工作法：25分钟专注，5分钟休息")
        recommendations.append("📝 每天开始前花5分钟规划今天的任务优先级")
    
    return recommendations
