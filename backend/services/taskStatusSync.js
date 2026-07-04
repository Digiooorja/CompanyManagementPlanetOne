const { Op } = require('sequelize');
const Task = require('../models/Task');

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

// Recomputes a parent task's progress as the average of its subtasks'
// progress — the subtask -> task roll-up required by §5.3's acceptance
// criteria ("Progress rolls up correctly from subtask to task...").
async function recalcParentTaskProgress(parentTaskId) {
  if (!parentTaskId) return;

  const subtasks = await Task.findAll({ where: { parentTaskId }, attributes: ['progress'] });
  if (subtasks.length === 0) return;

  const avg = Math.round(subtasks.reduce((sum, t) => sum + Number(t.progress || 0), 0) / subtasks.length);
  await Task.update({ progress: avg }, { where: { id: parentTaskId }, individualHooks: true });
}

module.exports = { syncAllOverdueTasks, recalcParentTaskProgress };
