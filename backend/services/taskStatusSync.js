const { Op } = require('sequelize');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');

// Automatically flips a Task's status to 'Overdue' once its due date has
// passed and it's still below 100% complete (Requirements §5.3 business
// rule). Uses individualHooks so each transition is still captured by the
// central Audit Log (§5.4) even though this is a bulk update.
async function syncAllOverdueTasks() {
  const now = new Date();
  const [affected] = await Task.update(
    { status: 'Overdue' },
    {
      where: {
        dueDate: { [Op.lt]: now },
        progress: { [Op.lt]: 100 },
        status: { [Op.notIn]: ['Completed', 'Overdue'] }
      },
      individualHooks: true
    }
  );
  return affected;
}

// Resolves which Project (if any) a task belongs to — either directly
// (relatedType === 'Project') or transitively via a linked Activity
// (relatedType === 'Activity', whose own projectId is looked up). Returns
// null if the task isn't tied to any project.
async function resolveTaskProjectId(task) {
  if (!task) return null;
  if (task.relatedType === 'Project' && task.relatedId) {
    return Number(task.relatedId);
  }
  if (task.relatedType === 'Activity' && task.relatedId) {
    const activity = await Activity.findByPk(task.relatedId, { attributes: ['projectId'] });
    return activity ? activity.projectId : null;
  }
  return null;
}

// Weight (in whole days) a work item contributes to a duration-weighted
// rollup, so a long-planned activity pulls the average further than a
// one-day task (business rule requested 2026-07-07: "if plan duration for
// one activity is high, the weightage should be high in completion
// percentage"). Prefers planned dates (Activity: plannedStartDate/
// plannedEndDate, Task: startDate/dueDate) and falls back to actual dates
// if planned ones aren't set yet. Mirrors routes/activities.js's
// getActivityDurationInDays() so every rollup level (sub-activity ->
// activity, and activity/task -> project) uses the same basis. Items with
// no usable date pair at all still count, just with the minimum weight of
// 1 day, so they aren't silently excluded from the average.
function getDurationWeightInDays(item) {
  const start = item.plannedStartDate || item.startDate || item.actualStartDate || null;
  const end = item.plannedEndDate || item.dueDate || item.actualEndDate || null;

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate >= startDate) {
      return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    }
  }

  return 1;
}

// Recomputes a parent task's progress as the duration-weighted average of
// its subtasks' progress (each subtask weighted by its own planned
// duration) — the subtask -> task roll-up required by §5.3's acceptance
// criteria ("Progress rolls up correctly from subtask to task..."), now
// consistent with the activity-level rollup's duration weighting.
async function recalcParentTaskProgress(parentTaskId) {
  if (!parentTaskId) return;

  const subtasks = await Task.findAll({
    where: { parentTaskId },
    attributes: ['progress', 'startDate', 'dueDate']
  });
  if (subtasks.length === 0) return;

  let totalWeightedProgress = 0;
  let totalWeight = 0;
  subtasks.forEach((t) => {
    const weight = getDurationWeightInDays(t);
    totalWeightedProgress += Number(t.progress || 0) * weight;
    totalWeight += weight;
  });

  const avg = Math.round(totalWeightedProgress / totalWeight);
  await Task.update({ progress: avg }, { where: { id: parentTaskId }, individualHooks: true });
}

// Recomputes a Project's `completion` as the duration-weighted average
// progress across its top-level Activities (parentActivityId null) and its
// top-level tasks (parentTaskId null) directly linked to the project — the
// roll-up required to close the §5.3 "task/activity -> project progress
// roll-up" gap. Activities are included because they are the primary,
// populated work-breakdown-structure in real usage (Tasks are frequently
// left unlinked — relatedType 'General' — so a Task-only roll-up left
// `completion` permanently stuck at 0 even with dozens of real Activities
// tracking real progress; found 2026-07-07 investigating a report that the
// percentage wasn't reflecting on the Projects table / Executive Dashboard).
// Activity-linked tasks (relatedType 'Activity') are intentionally NOT
// pooled here separately, to avoid double-counting the same work twice —
// their contribution is already reflected via their parent Activity's own
// `progress` field. Sub-activity progress is likewise not counted
// separately since it has already rolled up into its top-level Activity's
// `progress` via updateParentProgress() in routes/activities.js. Only
// overwrites `completion` when at least one relevant Activity/Task exists,
// so a project with neither yet keeps whatever value was set manually via
// the Projects.tsx Edit dialog.
//
// Each item is weighted by its own planned duration in days
// (getDurationWeightInDays()) rather than counted equally — an activity
// planned to run for 6 months should move the project % more than a task
// planned for 2 days (business rule requested 2026-07-07). Items with no
// planned dates yet default to a weight of 1 day, so they still count but
// don't dominate.
async function recalcProjectCompletion(projectId) {
  if (!projectId) return;

  const topLevelActivities = await Activity.findAll({
    where: { projectId, parentActivityId: null },
    attributes: ['progress', 'plannedStartDate', 'plannedEndDate', 'actualStartDate', 'actualEndDate']
  });

  const directTasks = await Task.findAll({
    where: { relatedType: 'Project', relatedId: projectId, parentTaskId: null },
    attributes: ['progress', 'startDate', 'dueDate']
  });

  const allItems = [...topLevelActivities, ...directTasks];
  if (allItems.length === 0) return;

  let totalWeightedProgress = 0;
  let totalWeight = 0;
  allItems.forEach((item) => {
    const weight = getDurationWeightInDays(item);
    totalWeightedProgress += Number(item.progress || 0) * weight;
    totalWeight += weight;
  });

  const avg = totalWeight > 0 ? Math.round(totalWeightedProgress / totalWeight) : 0;
  await Project.update({ completion: Math.max(0, Math.min(100, avg)) }, { where: { id: projectId } });
}

// Convenience: resolve a task-like object's project, then recalc it.
// Accepts either a real Task instance or a plain { relatedType, relatedId }
// snapshot (used when recalculating for a task's *previous* project after
// it has been reassigned or deleted).
async function recalcProjectCompletionForTask(task) {
  const projectId = await resolveTaskProjectId(task);
  if (projectId) await recalcProjectCompletion(projectId);
}

module.exports = {
  syncAllOverdueTasks,
  recalcParentTaskProgress,
  resolveTaskProjectId,
  recalcProjectCompletion,
  recalcProjectCompletionForTask,
  getDurationWeightInDays
};
