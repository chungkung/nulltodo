import { useState, useCallback } from 'react';
import { Task } from '@/types';
import { useTaskStore } from '@/stores/taskStore';

interface DraggableTaskListProps {
  tasks: Task[];
  renderTask: (task: Task, index: number) => React.ReactNode;
}

export default function DraggableTaskList({
  tasks,
  renderTask,
}: DraggableTaskListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [localOrder, setLocalOrder] = useState<Task[]>(tasks);
  const fetchTasks = useTaskStore(state => state.fetchTasks);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...tasks];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setLocalOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, tasks, fetchTasks]);

  const sortedTasks = localOrder.length === tasks.length ? localOrder : tasks;

  return (
    <div className="space-y-2">
      {sortedTasks.map((task, index) => (
        <div
          key={task.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          className={`
            transition-all duration-200
            ${dragOverIndex === index ? 'transform scale-[1.02]' : ''}
            ${draggedIndex === index ? 'opacity-50' : ''}
          `}
        >
          <div className={`
            relative group
            ${dragOverIndex === index ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl' : ''}
          `}>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing pl-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
            {renderTask(task, index)}
          </div>
        </div>
      ))}
    </div>
  );
}
