const pool = require('../database/db');

/**
 * Calculate and update dashboard priority based on thread count
 * Priority levels:
 * - High/Critical: 10+ threads
 * - Medium: 5-9 threads
 * - Low: 1-4 threads
 * - None: 0 threads
 */
async function updateDashboardPriority(dashboardId) {
  try {
    // Count total threads for this dashboard
    const threadCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM issues WHERE dashboard_id = $1',
      [dashboardId]
    );
    const threadCount = parseInt(threadCountResult.rows[0].count) || 0;

    // Determine priority level
    let priority;
    if (threadCount >= 10) {
      priority = 'high';
    } else if (threadCount >= 5) {
      priority = 'medium';
    } else if (threadCount >= 1) {
      priority = 'low';
    } else {
      priority = 'none';
    }

    // Update dashboard priority (we'll add this column if it doesn't exist)
    // For now, we'll calculate it dynamically in queries
    return { priority, threadCount };
  } catch (error) {
    console.error('Error updating dashboard priority:', error);
    return { priority: 'none', threadCount: 0 };
  }
}

/**
 * Calculate and update chart priority based on thread count
 */
async function updateChartPriority(chartId) {
  try {
    const threadCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM issues WHERE chart_id = $1',
      [chartId]
    );
    const threadCount = parseInt(threadCountResult.rows[0].count) || 0;

    let priority;
    if (threadCount >= 10) {
      priority = 'high';
    } else if (threadCount >= 5) {
      priority = 'medium';
    } else if (threadCount >= 1) {
      priority = 'low';
    } else {
      priority = 'none';
    }

    return { priority, threadCount };
  } catch (error) {
    console.error('Error updating chart priority:', error);
    return { priority: 'none', threadCount: 0 };
  }
}

module.exports = { updateDashboardPriority, updateChartPriority };

