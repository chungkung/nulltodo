import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict

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


def get_completion_rate_trends(days: int = 30) -> List[Dict]:
    """获取完成率趋势"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    since = (datetime.now() - timedelta(days=days)).isoformat()
    trends = []
    
    # 过去30天，每天统计完成率
    today = datetime.now()
    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        date_str = date.strftime('%Y-%m-%d')
        date_start = date_str + ' 00:00:00'
        date_end = date_str + ' 23:59:59'
        
        # 查询当天创建的任务
        cursor.execute('''
            SELECT COUNT(*) FROM tasks
            WHERE created_at >= ? AND created_at <= ?
        ''', (date_start, date_end))
        total = cursor.fetchone()[0]
        
        # 查询当天完成的任务
        cursor.execute('''
            SELECT COUNT(*) FROM tasks
            WHERE status = 'completed'
            AND completed_at >= ? AND completed_at <= ?
        ''', (date_start, date_end))
        completed = cursor.fetchone()[0]
        
        rate = completed / total if total > 0 else 0
        
        trends.append({
            'date': date_str,
            'total': total,
            'completed': completed,
            'completion_rate': round(rate, 2)
        })
    
    conn.close()
    return trends


def get_average_completion_time(days: int = 30) -> Dict:
    """获取平均完成时间"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    since = (datetime.now() - timedelta(days=days)).isoformat()
    
    cursor.execute('''
        SELECT 
            content,
            created_at,
            completed_at,
            priority,
            estimated_hours
        FROM tasks
        WHERE status = 'completed'
        AND completed_at > ?
    ''', (since,))
    
    tasks = cursor.fetchall()
    conn.close()
    
    durations = []
    priority_durations = defaultdict(list)
    
    for task in tasks:
        created = parse_datetime(task['created_at'])
        completed = parse_datetime(task['completed_at'])
        
        if created and completed:
            duration_hours = (completed - created).total_seconds() / 3600
            durations.append(duration_hours)
            priority_durations[task['priority']].append(duration_hours)
    
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    priority_avg = {}
    for priority, times in priority_durations.items():
        priority_avg[priority] = sum(times) / len(times) if times else 0
    
    return {
        'days': days,
        'sample_count': len(durations),
        'average_completion_hours': round(avg_duration, 2),
        'average_by_priority': {
            p: round(t, 2) for p, t in priority_avg.items()
        },
        'fastest_task': min(durations) if durations else 0,
        'slowest_task': max(durations) if durations else 0
    }


def analyze_procrastination_patterns(days: int = 90) -> Dict:
    """分析拖延模式"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    since = (datetime.now() - timedelta(days=days)).isoformat()
    
    # 获取完成的任务，分析拖延习惯
    cursor.execute('''
        SELECT 
            t.id,
            t.content,
            t.priority,
            t.created_at,
            t.deadline,
            t.completed_at
        FROM tasks t
        WHERE t.status = 'completed'
        AND t.completed_at > ?
        AND t.deadline IS NOT NULL
    ''', (since,))
    
    tasks = cursor.fetchall()
    conn.close()
    
    procrastination_stats = {
        'total': 0,
        'procrastinated': 0,
        'last_minute': 0,
        'early_completion': 0,
        'average_completion_before_deadline_hours': 0,
        'patterns': []
    }
    
    completion_diffs = []
    
    for task in tasks:
        task_dict = dict(task)
        procrastination_stats['total'] += 1
        
        deadline = parse_datetime(task_dict['deadline'])
        completed_at = parse_datetime(task_dict['completed_at'])
        created_at = parse_datetime(task_dict['created_at'])
        
        if deadline and completed_at and created_at:
            # 计算距离截止时间的完成时间
            hours_before_deadline = (deadline - completed_at).total_seconds() / 3600
            completion_diffs.append(hours_before_deadline)
            
            pattern = {
                'content': task_dict['content'],
                'priority': task_dict['priority'],
                'hours_before_deadline': round(hours_before_deadline, 2),
                'is_procrastinated': False
            }
            
            if hours_before_deadline < 0:
                # 逾期完成
                procrastination_stats['procrastinated'] += 1
                pattern['is_procrastinated'] = True
                pattern['overdue_hours'] = abs(hours_before_deadline)
            elif hours_before_deadline < 6:
                # 最后6小时完成
                procrastination_stats['last_minute'] += 1
                pattern['is_last_minute'] = True
            elif hours_before_deadline > 72:
                # 提前3天以上完成
                procrastination_stats['early_completion'] += 1
                pattern['is_early'] = True
            
            procrastination_stats['patterns'].append(pattern)
    
    if completion_diffs:
        procrastination_stats['average_completion_before_deadline_hours'] = round(sum(completion_diffs) / len(completion_diffs), 2)
    
    # 计算拖延率
    if procrastination_stats['total'] > 0:
        procrastination_stats['procrastination_rate'] = round(procrastination_stats['procrastinated'] / procrastination_stats['total'], 2)
        procrastination_stats['last_minute_rate'] = round(procrastination_stats['last_minute'] / procrastination_stats['total'], 2)
    
    return procrastination_stats


def get_working_habit_analysis(days: int = 30) -> Dict:
    """分析工作习惯"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    since = (datetime.now() - timedelta(days=days)).isoformat()
    
    # 获取完成时间，分析最活跃时段
    cursor.execute('''
        SELECT completed_at
        FROM tasks
        WHERE status = 'completed'
        AND completed_at > ?
    ''', (since,))
    
    completed_times = cursor.fetchall()
    conn.close()
    
    hour_distribution = defaultdict(int)
    weekday_distribution = defaultdict(int)
    total = 0
    
    for row in completed_times:
        dt = parse_datetime(row['completed_at'])
        if dt:
            total += 1
            hour_distribution[dt.hour] += 1
            weekday_distribution[dt.weekday()] += 1
    
    # 找出最佳工作时段
    best_hour = None
    max_count = 0
    for hour, count in hour_distribution.items():
        if count > max_count:
            max_count = count
            best_hour = hour
    
    # 找出最佳工作日
    weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    best_weekday = None
    max_weekday_count = 0
    for weekday, count in weekday_distribution.items():
        if count > max_weekday_count:
            max_weekday_count = count
            best_weekday = weekdays[weekday]
    
    return {
        'days': days,
        'total_completed': total,
        'hour_distribution': dict(hour_distribution),
        'weekday_distribution': {weekdays[k]: v for k, v in weekday_distribution.items()},
        'best_hour': best_hour,
        'best_weekday': best_weekday,
        'recommendations': _generate_habit_recommendations(
            hour_distribution, weekday_distribution, total
        )
    }


def _generate_habit_recommendations(
    hour_distribution: Dict, 
    weekday_distribution: Dict, 
    total: int
) -> List[str]:
    """生成习惯建议"""
    recommendations = []
    
    if total < 5:
        recommendations.append("📊 样本数据太少，建议继续使用一段时间获得更准确的分析")
        return recommendations
    
    # 分析最佳工作时间
    best_hour = max(hour_distribution.items(), key=lambda x: x[1])[0] if hour_distribution else None
    if best_hour:
        if 5 <= best_hour < 10:
            recommendations.append(f"🌅 你最有效率的时段是早晨{best_hour}点，建议把重要任务安排在这个时间")
        elif 10 <= best_hour < 14:
            recommendations.append(f"☀️ 你最有效率的时段是上午{best_hour}点，这是完成困难任务的好时间")
        elif 14 <= best_hour < 18:
            recommendations.append(f"🌤️ 你最有效率的时段是下午{best_hour}点，可以安排核心工作")
        elif 18 <= best_hour < 22:
            recommendations.append(f"🌙 你最有效率的时段是晚上{best_hour}点，适合安静思考的任务")
        else:
            recommendations.append(f"😴 你最有效率的时段是凌晨{best_hour}点，注意保持充足睡眠")
    
    # 分析周工作模式
    if weekday_distribution:
        weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        sorted_weekdays = sorted(weekday_distribution.items(), key=lambda x: -x[1])
        
        if sorted_weekdays[0][0] in [5, 6]:  # 周末
            recommendations.append("📅 你在周末完成任务最多，考虑在工作日适当减负")
        elif sorted_weekdays[0][0] == 0:  # 周一
            recommendations.append("📅 周一你效率最高！利用周一的势头完成重要工作")
    
    return recommendations


def get_personalized_insights() -> Dict:
    """获取个性化分析报告"""
    completion_trends = get_completion_rate_trends()
    avg_completion_time = get_average_completion_time()
    procrastination = analyze_procrastination_patterns()
    working_habits = get_working_habit_analysis()
    
    # 生成综合报告
    report = {
        'completion_trends': completion_trends,
        'average_completion_time': avg_completion_time,
        'procrastination_analysis': procrastination,
        'working_habits': working_habits,
        'summary': _generate_summary_report(
            completion_trends,
            avg_completion_time,
            procrastination,
            working_habits
        )
    }
    
    return report


def _generate_summary_report(
    completion_trends: List[Dict],
    avg_completion_time: Dict,
    procrastination: Dict,
    working_habits: Dict
) -> Dict:
    """生成综合报告摘要"""
    insights = []
    warnings = []
    positive_points = []
    
    # 分析完成率趋势
    recent_trend = completion_trends[-7:]  # 最近7天
    avg_recent_rate = sum(t['completion_rate'] for t in recent_trend) / len(recent_trend) if recent_trend else 0
    
    if avg_recent_rate < 0.3:
        warnings.append(f"⚠️ 最近7天平均完成率只有{avg_recent_rate:.0%}，需要关注任务数量和精力管理")
    elif avg_recent_rate < 0.6:
        insights.append(f"📊 最近7天平均完成率{avg_recent_rate:.0%}，有提升空间")
    elif avg_recent_rate < 0.85:
        positive_points.append(f"✓ 最近7天平均完成率{avg_recent_rate:.0%}，表现不错！")
    else:
        positive_points.append(f"🎉 最近7天平均完成率{avg_recent_rate:.0%}，太棒了！")
    
    # 分析拖延习惯
    procrastination_rate = procrastination.get('procrastination_rate', 0)
    if procrastination_rate > 0.5:
        warnings.append(f"⚠️ 你的拖延率高达{procrastination_rate:.0%}，建议使用时间管理技巧")
    elif procrastination_rate > 0.2:
        insights.append(f"📊 你有{procrastination_rate:.0%}的任务逾期完成，可以考虑提前开始")
    else:
        positive_points.append(f"✓ 你的拖延率仅{procrastination_rate:.0%}，时间管理很好！")
    
    # 分析工作习惯
    if working_habits.get('best_hour'):
        best_hour = working_habits['best_hour']
        positive_points.append(f"⏰ 你的黄金工作时段是{best_hour}点，把重要任务安排在这个时间")
    
    if working_habits.get('best_weekday'):
        positive_points.append(f"📅 {working_habits['best_weekday']}是你效率最高的日子")
    
    return {
        'insights': insights,
        'warnings': warnings,
        'positive_points': positive_points,
        'overall_score': _calculate_overall_score(
            avg_recent_rate, procrastination_rate
        )
    }


def _calculate_overall_score(completion_rate: float, procrastination_rate: float) -> int:
    """计算总体评分"""
    score = 50  # 基准分
    
    # 完成率加分
    score += completion_rate * 30
    
    # 拖延率扣分
    score -= procrastination_rate * 20
    
    # 限制在0-100
    return max(0, min(100, int(score)))
