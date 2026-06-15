from datetime import datetime, timedelta

class ScheduleService:
    def __init__(self):
        pass

    def _get_task_service(self):
        from flask import g, current_app
        if not hasattr(g, 'task_service'):
            from services.task_service import TaskService
            g.task_service = TaskService()
        return g.task_service

    def get_schedule(self, start: str = None, end: str = None):
        if not start:
            start = datetime.now().strftime('%Y-%m-%d')
        if not end:
            end = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')

        task_service = self._get_task_service()
        tasks = task_service.get_all_tasks()

        schedule = []
        conflicts = []
        suggestions = []

        for task in tasks:
            if task.get('deadline'):
                try:
                    deadline = datetime.fromisoformat(task['deadline'])
                    task_date = deadline.strftime('%Y-%m-%d')

                    if start <= task_date <= end:
                        schedule.append({
                            'id': task['id'],
                            'content': task['content'],
                            'date': task_date,
                            'start_time': deadline.strftime('%H:%M'),
                            'end_time': (deadline + timedelta(hours=task.get('estimated_hours', 1))).strftime('%H:%M'),
                            'priority': task['priority'],
                            'status': task['status']
                        })
                except Exception as e:
                    print(f"Error parsing deadline: {e}")
                    continue

        schedule.sort(key=lambda x: (x['date'], x['start_time']))

        return {
            'schedule': schedule,
            'conflicts': conflicts,
            'suggestions': suggestions
        }

    def optimize_schedule(self):
        task_service = self._get_task_service()
        tasks = task_service.get_all_tasks()

        settings = task_service.get_settings()

        work_start = datetime.strptime(settings.get('work_start', '09:00'), '%H:%M')
        work_end = datetime.strptime(settings.get('work_end', '18:00'), '%H:%M')

        pending_tasks = [t for t in tasks if t['status'] in ['pending', 'overdue']]
        pending_tasks.sort(key=lambda x: (
            0 if x['priority'] == 'urgent' else 1 if x['priority'] == 'high' else 2,
            x.get('deadline', '9999-12-31')
        ))

        optimized = []
        current_date = datetime.now().replace(hour=work_start.hour, minute=work_start.minute, second=0, microsecond=0)

        for task in pending_tasks[:10]:
            estimated_hours = task.get('estimated_hours', 1)

            if task.get('deadline'):
                try:
                    deadline = datetime.fromisoformat(task['deadline'])
                    if deadline < current_date + timedelta(hours=estimated_hours):
                        current_date = deadline - timedelta(hours=estimated_hours)
                except:
                    pass

            if current_date.hour + estimated_hours > work_end.hour:
                current_date = current_date + timedelta(days=1)
                current_date = current_date.replace(hour=work_start.hour, minute=work_start.minute)

            optimized.append({
                'id': task['id'],
                'content': task['content'],
                'suggested_date': current_date.strftime('%Y-%m-%d'),
                'suggested_start': current_date.strftime('%H:%M'),
                'suggested_end': (current_date + timedelta(hours=estimated_hours)).strftime('%H:%M'),
                'priority': task['priority']
            })

            current_date = current_date + timedelta(hours=estimated_hours)

        return {
            'optimized': optimized,
            'message': f'已为{len(optimized)}个待办任务生成优化建议'
        }
