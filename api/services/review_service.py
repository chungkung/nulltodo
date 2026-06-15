import json
import uuid
from datetime import datetime, timedelta
from collections import Counter

class ReviewService:
    def __init__(self):
        pass

    def _get_task_service(self):
        from flask import g
        if not hasattr(g, 'task_service'):
            from services.task_service import TaskService
            g.task_service = TaskService()
        return g.task_service

    def get_daily_review(self) -> dict:
        today = datetime.now().strftime('%Y-%m-%d')
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

        task_service = self._get_task_service()
        tasks = task_service.get_all_tasks()
        
        completed = [t for t in tasks if t.get('completed_at', '').startswith(today)]
        today_created = [t for t in tasks if t.get('created_at', '').startswith(today)]
        pending = [t for t in tasks if t['status'] in ['pending', 'in_progress']]

        return self._generate_review({
            'period_type': 'daily',
            'period_start': today,
            'period_end': today,
            'total_tasks': len(today_created),
            'completed': len(completed),
            'pending': len(pending),
            'completion_rate': len(today_created) > 0 and round(len(completed) / len(today_created) * 100, 1) or 0
        }, tasks)

    def get_weekly_review(self) -> dict:
        today = datetime.now()
        week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        week_end = today.strftime('%Y-%m-%d')

        task_service = self._get_task_service()
        tasks = task_service.get_all_tasks()

        week_tasks = []
        for task in tasks:
            try:
                created = datetime.fromisoformat(task.get('created_at', ''))
                if week_start <= created.strftime('%Y-%m-%d') <= week_end:
                    week_tasks.append(task)
            except:
                continue

        completed = [t for t in week_tasks if t['status'] == 'completed']
        overdue = [t for t in week_tasks if t['status'] == 'overdue']

        on_time = len([t for t in completed if t.get('completed_at') and t.get('deadline') and
                      datetime.fromisoformat(t['completed_at']) <= datetime.fromisoformat(t['deadline'])])

        return self._generate_review({
            'period_type': 'weekly',
            'period_start': week_start,
            'period_end': week_end,
            'total_tasks': len(week_tasks),
            'completed': len(completed),
            'pending': len(week_tasks) - len(completed),
            'completion_rate': len(week_tasks) > 0 and round(len(completed) / len(week_tasks) * 100, 1) or 0,
            'on_time_rate': len(completed) > 0 and round(on_time / len(completed) * 100, 1) or 0,
            'overdue': len(overdue)
        }, week_tasks)

    def _generate_review(self, stats: dict, tasks: list) -> dict:
        scenario_counter = Counter(t.get('scenario', 'general') for t in tasks)
        priority_counter = Counter(t.get('priority', 'medium') for t in tasks)

        delayed = [t for t in tasks if t['status'] == 'overdue']
        top_delayed = [t['content'] for t in delayed[:5]]

        day_counter = Counter()
        hour_counter = Counter()

        for task in tasks:
            if task.get('completed_at'):
                try:
                    completed = datetime.fromisoformat(task['completed_at'])
                    day_counter[completed.strftime('%A')] += 1
                    hour_counter[completed.hour] += 1
                except:
                    continue

        most_productive_day = day_counter.most_common(1)[0][0] if day_counter else '无数据'
        peak_hours = f"{hour_counter.most_common(1)[0][0]}:00-{hour_counter.most_common(1)[0][0]+1}:00" if hour_counter else '无数据'

        suggestions = self._generate_suggestions(stats, tasks)

        return {
            'id': str(uuid.uuid4()),
            'period_type': stats['period_type'],
            'period_start': stats['period_start'],
            'period_end': stats['period_end'],
            'stats': {
                'total_tasks': stats['total_tasks'],
                'completed': stats['completed'],
                'completion_rate': stats['completion_rate'],
                'on_time_rate': stats.get('on_time_rate', 0),
                'avg_duration': sum(t.get('estimated_hours', 1) for t in tasks) / max(len(tasks), 1)
            },
            'analysis': {
                'top_delayed': top_delayed,
                'most_productive_day': most_productive_day,
                'peak_hours': peak_hours,
                'scenario_distribution': dict(scenario_counter),
                'priority_distribution': dict(priority_counter)
            },
            'suggestions': suggestions,
            'created_at': datetime.now().isoformat()
        }

    def _generate_suggestions(self, stats: dict, tasks: list) -> list:
        suggestions = []

        if stats['completion_rate'] >= 80:
            suggestions.append("太棒了！本周完成率超过80%，继续保持这个节奏")
        elif stats['completion_rate'] >= 60:
            suggestions.append("完成率不错，建议尝试将大任务拆分为小任务，提高完成动力")
        else:
            suggestions.append("建议减少同时进行的任务数量，专注于最重要的事情")

        overdue = [t for t in tasks if t['status'] == 'overdue']
        if len(overdue) > 0:
            suggestions.append(f"有{len(overdue)}个任务逾期，建议重新评估任务优先级和截止时间")

        urgent = [t for t in tasks if t['priority'] == 'urgent']
        if len(urgent) > 3:
            suggestions.append("紧急任务较多，建议适当推迟非关键任务，避免过度压力")

        high_priority = [t for t in tasks if t['priority'] == 'high']
        if len(high_priority) > 5:
            suggestions.append("高优先级任务较多，建议集中精力完成后再处理其他事项")

        suggestions.append("建议每天早上花5分钟规划当天任务，提高执行效率")

        return suggestions[:5]
