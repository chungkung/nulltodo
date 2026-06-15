import React, { useState, useEffect } from 'react';
import { analyticsApi } from '@/services/tagService';

export const TrendChart: React.FC = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getTrends(days);
      setTrends(data);
    } catch (err) {
      console.error('Failed to fetch trends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [days]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const maxCount = Math.max(...trends.map(t => t.count), 1);
  const width = 800;
  const height = 300;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // 生成折线图路径
  const getPath = () => {
    if (trends.length === 0) return '';
    
    const points = trends.map((t, i) => {
      const x = padding + (i / (trends.length - 1)) * chartWidth;
      const y = padding + chartHeight - (t.count / maxCount) * chartHeight;
      return `${x},${y}`;
    });
    
    return 'M ' + points.join(' L ');
  };

  // 生成面积图路径
  const getAreaPath = () => {
    if (trends.length === 0) return '';
    
    const points = trends.map((t, i) => {
      const x = padding + (i / (trends.length - 1)) * chartWidth;
      const y = padding + chartHeight - (t.count / maxCount) * chartHeight;
      return `${x},${y}`;
    });
    
    const firstX = padding;
    const firstY = padding + chartHeight;
    const lastX = padding + chartWidth;
    const lastY = padding + chartHeight;
    
    return 'M ' + firstX + ',' + firstY + 
           ' L ' + points.join(' L ') + 
           ' ' + lastX + ',' + lastY + ' Z';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          📈 逾期任务趋势
        </h3>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="p-2 border rounded dark:bg-gray-700 dark:text-white"
        >
          <option value={7}>7 天</option>
          <option value={14}>14 天</option>
          <option value={30}>30 天</option>
          <option value={90}>90 天</option>
        </select>
      </div>

      {trends.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无数据
        </div>
      ) : (
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="mx-auto">
            {/* 背景网格线 */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <line
                key={ratio}
                x1={padding}
                y1={padding + ratio * chartHeight}
                x2={width - padding}
                y2={padding + ratio * chartHeight}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}

            {/* 面积图 */}
            <path
              d={getAreaPath()}
              fill="rgba(239, 68, 68, 0.2)"
              stroke="none"
            />

            {/* 折线 */}
            <path
              d={getPath()}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 数据点 */}
            {trends.map((t, i) => {
              const x = padding + (i / (trends.length - 1)) * chartWidth;
              const y = padding + chartHeight - (t.count / maxCount) * chartHeight;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#ef4444"
                />
              );
            })}

            {/* Y轴标签 */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const value = Math.round(ratio * maxCount);
              const y = padding + ratio * chartHeight;
              return (
                <text
                  key={ratio}
                  x={padding - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs text-gray-500"
                >
                  {value}
                </text>
              );
            })}

            {/* X轴标签 */}
            {trends.filter((_, i) => i % Math.ceil(trends.length / 7) === 0 || i === trends.length - 1).map((t, i) => {
              const x = padding + (i / (trends.length - 1)) * chartWidth;
              const y = height - padding + 20;
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  className="text-xs text-gray-500"
                >
                  {t.date.slice(5)}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
