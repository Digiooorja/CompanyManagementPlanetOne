import { useRef, useEffect, useState } from 'react';

interface Activity {
  id: number;
  name: string;
  status: string;
  assignedTo?: string;
  progress?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  plannedCost?: number;
  actualCost?: number;
  dependencies?: string;
  order?: number;
  subactivities?: Activity[];
}

interface ProjectGanttChartProps {
  activities: Activity[];
  projectStartDate: string;
  projectEndDate: string;
}

export function ProjectGanttChart({ activities, projectStartDate, projectEndDate }: ProjectGanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Toggle expand/collapse for an activity
  const toggleActivityExpand = (activityId: number) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const parseDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const flattenAllActivities = (activities: Activity[]): Activity[] =>
    activities.flatMap((activity) => [
      activity,
      ...(activity.subactivities ? flattenAllActivities(activity.subactivities) : []),
    ]);

  const allActivities = flattenAllActivities(activities);
  const activityStartDates = allActivities
    .map((activity) => parseDate(activity.plannedStartDate) || parseDate(activity.actualStartDate))
    .filter((date): date is Date => date !== null);
  const activityEndDates = allActivities
    .map((activity) => parseDate(activity.plannedEndDate) || parseDate(activity.actualEndDate))
    .filter((date): date is Date => date !== null);

  const projectStart = parseDate(projectStartDate);
  const projectEnd = parseDate(projectEndDate);

  // const startDate = projectStart
  //   ? activityStartDates.length > 0
  //     ? new Date(Math.min(projectStart.getTime(), ...activityStartDates.map((d) => d.getTime())))
  //     : projectStart
  //   : activityStartDates.length > 0
  //   ? new Date(Math.min(...activityStartDates.map((d) => d.getTime())))
  //   : null;

  // const endDate = projectEnd
  //   ? activityEndDates.length > 0
  //     ? new Date(Math.max(projectEnd.getTime(), ...activityEndDates.map((d) => d.getTime())))
  //     : projectEnd
  //   : activityEndDates.length > 0
  //   ? new Date(Math.max(...activityEndDates.map((d) => d.getTime())))
  //   : null;

    // Use min of all activity start dates, ignore the prop projectStartDate
  const startDate = activityStartDates.length > 0
  ? new Date(Math.min(...activityStartDates.map((d) => d.getTime())))
  : projectStart || null;

    // Use min of all activity start dates, ignore the prop projectStartDate
  const endDate = activityEndDates.length > 0
  ? new Date(Math.max(...activityEndDates.map((d) => d.getTime())))
  : projectEnd || null;

  const dayMs = 1000 * 60 * 60 * 24;
  const totalDays = startDate && endDate ? Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs), 1) : 0;

  // Helper function to flatten activities with subactivities based on expanded state
  const flattenActivities = (activities: Activity[]): Array<Activity & { level: number; parentId?: number }> => {
    const flattened: Array<Activity & { level: number; parentId?: number }> = [];

    // Sort activities by order field
    const sortedActivities = [...activities].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      return orderA - orderB;
    });

    sortedActivities.forEach(activity => {
      flattened.push({ ...activity, level: 0 });
      // Only include subactivities if parent is expanded
      if (activity.subactivities && expandedActivities.has(activity.id)) {
        // Sort sub-activities by order as well
        const sortedSubs = [...activity.subactivities].sort((a, b) => {
          const orderA = a.order ?? 0;
          const orderB = b.order ?? 0;
          return orderA - orderB;
        });
        sortedSubs.forEach(subactivity => {
          flattened.push({ ...subactivity, level: 1, parentId: activity.id });
        });
      }
    });

    return flattened;
  };

  const chartWidth = Math.max(containerWidth - 40, 600); // Minimum width of 600px, subtract padding
  const headerHeight = 90;
  const rowHeight = 80; // Reduced row height for subactivities
  const flattenedActivities = flattenActivities(activities);
  const chartHeight = flattenedActivities.length * rowHeight + headerHeight + 100; // Increased height for dual bars + legend space
  const leftColumnWidth = 280; // Increased for indentation and buttons
  const timelineWidth = chartWidth - leftColumnWidth - 20;

  const getXPosition = (date?: string) => {
    if (!date || !startDate || totalDays <= 0) return leftColumnWidth;
    const activityDate = parseDate(date);
    if (!activityDate) return leftColumnWidth;
    const daysFromStart = Math.min(totalDays, Math.max(0, Math.ceil((activityDate.getTime() - startDate.getTime()) / dayMs)));
    return leftColumnWidth + (daysFromStart / totalDays) * timelineWidth;
  };

  const getBarWidth = (start?: string, end?: string) => {
    const startParsed = parseDate(start);
    const endParsed = parseDate(end);
    if (!startParsed || !endParsed || totalDays <= 0) return 0;
    const days = Math.max(1, Math.ceil((endParsed.getTime() - startParsed.getTime()) / dayMs));
    return Math.max((days / totalDays) * timelineWidth, 20);
  };

  // Calculate months for timeline
  const months: { label: string; x: number }[] = [];
  const weeks: { label: string; x: number }[] = [];

  if (startDate && totalDays > 0) {
    for (let i = 0; i <= totalDays; i += 30) {
      const monthDate = new Date(startDate.getTime() + i * dayMs);
      const x = leftColumnWidth + (i / totalDays) * timelineWidth;
      months.push({
        label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        x,
      });
    }

    for (let i = 0; i <= totalDays; i += 7) {
      const x = leftColumnWidth + (i / totalDays) * timelineWidth;
      weeks.push({
        label: `W${Math.ceil((i + 1) / 7)}`,
        x,
      });
    }
  }

  if (!startDate || !endDate || totalDays === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-muted-foreground">
        Project timeline data is unavailable. Please verify project or activity dates.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full space-y-4">
      {/* Gantt Chart */}
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="border border-gray-200 min-w-full"
             onMouseDown={(e) => e.stopPropagation()}
             onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <rect width={chartWidth} height={headerHeight} fill="#f8f9fa" stroke="#dee2e6" />

        {/* Left column header */}
        <text x={10} y={35} fontSize="14" fontWeight="bold" fill="#495057">Activity</text>

        {/* Start / end dates */}
        <text x={leftColumnWidth + 10} y={28} fontSize="12" fill="#6c757d">
          {startDate.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
        </text>
        <text x={chartWidth - 10} y={28} fontSize="12" fill="#6c757d" textAnchor="end">
          {endDate.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
        </text>

        {/* Month labels */}
        {months.map((month, index) => (
          <g key={index}>
            <line
              x1={month.x}
              y1={headerHeight}
              x2={month.x}
              y2={chartHeight - 50} // Stop before legend
              stroke="#dee2e6"
              strokeWidth="1"
            />
            <text
              x={month.x + 5}
              y={45}
              fontSize="12"
              fill="#6c757d"
            >
              {month.label}
            </text>
          </g>
        ))}

        {/* Week labels */}
        {weeks.map((week, index) => (
          <text
            key={index}
            x={week.x + 5}
            y={63}
            fontSize="11"
            fill="#6c757d"
          >
            {week.label}
          </text>
        ))}

        {/* Activity rows */}
        {flattenedActivities.map((activity, index) => {
          const y = headerHeight + index * rowHeight + 10;
          const indent = activity.level * 20; // Indentation for subactivities
          const isParentWithSubs = activity.level === 0 && activity.subactivities && activity.subactivities.length > 0;

          return (
            <g
              key={`${activity.parentId || 0}-${activity.id}`}
              onClick={() => isParentWithSubs && toggleActivityExpand(activity.id)}
              style={isParentWithSubs ? { cursor: 'pointer' } : {}}
              onMouseEnter={(e) => {
                if (isParentWithSubs) {
                  const rect = e.currentTarget.querySelector('rect:first-child') as SVGRectElement;
                  if (rect) rect.style.fill = '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                if (isParentWithSubs) {
                  const rect = e.currentTarget.querySelector('rect:first-child') as SVGRectElement;
                  if (rect) rect.style.fill = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                }
              }}
            >
              {/* Row background */}
              <rect
                x={0}
                y={headerHeight + index * rowHeight}
                width={chartWidth}
                height={rowHeight}
                fill={index % 2 === 0 ? "#ffffff" : "#f8f9fa"}
                stroke="#dee2e6"
              />

              {/* Expand/collapse indicator for parent activities */}
              {isParentWithSubs && (
                <text
                  x={15}
                  y={y + 15}
                  fontSize="18"
                  fill="#495057"
                  fontWeight="bold"
                >
                  {expandedActivities.has(activity.id) ? "−" : "+"}
                </text>
              )}

              {/* Activity name */}
              <text x={35 + indent} y={y + 15} fontSize={activity.level === 0 ? "16" : "14"} fill="#495057" fontWeight={activity.level === 0 ? "500" : "400"}>
                {activity.name}
              </text>
              <text x={35 + indent} y={y + 30} fontSize="12" fill="#6c757d">
                {activity.assignedTo}
              </text>
              {activity.plannedStartDate && activity.plannedEndDate ? (
                <>
                  <rect
                    x={getXPosition(activity.plannedStartDate)}
                    y={y + (activity.level === 0 ? 8 : 12)}
                    width={getBarWidth(activity.plannedStartDate, activity.plannedEndDate)}
                    height={activity.level === 0 ? 16 : 12}
                    fill="#f59e0b"
                    rx="2"
                    opacity="0.85"
                  />

                  {getBarWidth(activity.plannedStartDate, activity.plannedEndDate) > 50 && (
                    <text
                      x={getXPosition(activity.plannedStartDate) + 5}
                      y={y + (activity.level === 0 ? 22 : 24)}
                      fontSize="11"
                      fill="#6c757d"
                    >
                      Planned
                    </text>
                  )}
                </>
              ) : null}

              {/* Actual bar (if exists) */}
              {activity.actualStartDate && activity.actualEndDate && (
                <>
                  <rect
                    x={getXPosition(activity.actualStartDate)}
                    y={y + (activity.level === 0 ? 34 : 30)}
                    width={getBarWidth(activity.actualStartDate, activity.actualEndDate)}
                    height={activity.level === 0 ? 16 : 12}
                    fill="#007bff"
                    rx="2"
                  />

                  {/* Progress fill within actual bar */}
                  <rect
                    x={getXPosition(activity.actualStartDate)}
                    y={y + (activity.level === 0 ? 34 : 30)}
                    width={getBarWidth(activity.actualStartDate, activity.actualEndDate) * ((activity.progress ?? 0) / 100)}
                    height={activity.level === 0 ? 16 : 12}
                    fill="#0056b3"
                    rx="2"
                  />

                  {/* Actual bar label */}
                  {getBarWidth(activity.actualStartDate, activity.actualEndDate) > 60 && (
                    <text
                      x={getXPosition(activity.actualStartDate) + 5}
                      y={y + (activity.level === 0 ? 48 : 42)}
                      fontSize="11"
                      fill="white"
                    >
                      Actual ({activity.progress ?? 0}%)
                    </text>
                  )}
                </>
              )}

              {/* Variance indicator */}
              {activity.actualEndDate && activity.plannedEndDate && activity.plannedStartDate && (
                <g>
                  {(() => {
                    const plannedEnd = new Date(activity.plannedEndDate);
                    const actualEnd = new Date(activity.actualEndDate);
                    const variance = Math.ceil((actualEnd.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24));

                    if (variance !== 0) {
                      const indicatorX = getXPosition(activity.plannedEndDate) + getBarWidth(activity.plannedStartDate, activity.plannedEndDate) + 5;
                      return (
                        <g>
                          <circle
                            cx={indicatorX}
                            cy={y + (activity.level === 0 ? 45 : 36)}
                            r="8"
                            fill={variance > 0 ? "#dc3545" : "#28a745"}
                          />
                          <text
                            x={indicatorX}
                            y={y + (activity.level === 0 ? 49 : 40)}
                            fontSize="12"
                            fill="white"
                            textAnchor="middle"
                          >
                            {variance > 0 ? `+${variance}` : variance}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })()}
                </g>
              )}

              {/* Status indicator */}
              <circle
                cx={getXPosition(activity.plannedStartDate) - 10}
                cy={y + 15}
                r="6"
                fill={
                  activity.status === 'Completed' ? '#28a745' :
                  activity.status === 'In Progress' ? '#ffc107' :
                  '#6c757d'
                }
              />
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(10, ${chartHeight - 80})`}>
          <circle cx="0" cy="0" r="4" fill="#28a745" />
          <text x="10" y="4" fontSize="10" fill="#495057">Completed</text>

          <circle cx="80" cy="0" r="4" fill="#ffc107" />
          <text x="90" y="4" fontSize="10" fill="#495057">In Progress</text>

          <circle cx="170" cy="0" r="4" fill="#6c757d" />
          <text x="180" y="4" fontSize="10" fill="#495057">Not Started</text>

          {/* Bar legend */}
          <rect x="0" y="15" width="15" height="6" fill="#e9ecef" opacity="0.7" />
          <text x="20" y="20" fontSize="9" fill="#495057">Planned Timeline</text>

          <rect x="120" y="15" width="15" height="6" fill="#007bff" />
          <text x="140" y="20" fontSize="9" fill="#495057">Actual Timeline</text>

          {/* Variance indicators */}
          <circle cx="240" cy="18" r="4" fill="#dc3545" />
          <text x="250" y="22" fontSize="9" fill="#495057">Delayed (days)</text>

          <circle cx="320" cy="18" r="4" fill="#28a745" />
          <text x="330" y="22" fontSize="9" fill="#495057">Ahead (days)</text>
        </g>
        </svg>
      </div>
    </div>
  );
}