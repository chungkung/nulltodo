import { useCallback } from 'react';
import { FixedSizeList } from 'react-window';
import { Task } from '@/types';
import TaskCard from './TaskCard';

interface TaskVirtualListProps {
  tasks: Task[];
  height: number;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: Task[];
}

function Row({ index, style, data }: RowProps) {
  const task = data[index];
  return (
    <div style={style} className="p-1">
      <TaskCard task={task} />
    </div>
  );
}

export default function TaskVirtualList({ tasks, height }: TaskVirtualListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">暂无任务</p>
      </div>
    );
  }

  return (
    <FixedSizeList
      height={height}
      itemCount={tasks.length}
      itemSize={180}
      width="100%"
      className="scrollbar-thin"
      itemData={tasks}
    >
      {Row}
    </FixedSizeList>
  );
}
