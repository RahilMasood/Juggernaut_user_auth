const { AuditLog, User } = require('../models');
const logger = require('../utils/logger');

class AuditLogService {
  /**
   * Query audit logs with filters and pagination
   */
  async queryLogs(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      const where = {};

      if (filters.firm_id) {
        where.firm_id = filters.firm_id;
      }

      if (filters.user_id) {
        where.user_id = filters.user_id;
      }

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.resource_type) {
        where.resource_type = filters.resource_type;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.start_date || filters.end_date) {
        const { Op } = require('sequelize');
        where.created_at = {};
        
        if (filters.start_date) {
          where.created_at[Op.gte] = new Date(filters.start_date);
        }
        
        if (filters.end_date) {
          where.created_at[Op.lte] = new Date(filters.end_date);
        }
      }

      const { rows: logs, count: total } = await AuditLog.findAndCountAll({
        where,
        include: [
          {
            association: 'user',
            attributes: ['id', 'email', 'first_name', 'last_name'],
            required: false
          },
          {
            association: 'firm',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        limit,
        offset,
        order: [[sort_by, sort_order]]
      });

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Query audit logs error:', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(firmId, filters = {}) {
    try {
      const { Op } = require('sequelize');
      const { sequelize } = require('../config/database');

      const where = { firm_id: firmId };

      if (filters.start_date || filters.end_date) {
        where.created_at = {};
        
        if (filters.start_date) {
          where.created_at[Op.gte] = new Date(filters.start_date);
        }
        
        if (filters.end_date) {
          where.created_at[Op.lte] = new Date(filters.end_date);
        }
      }

      // Get action counts
      const actionCounts = await AuditLog.findAll({
        where,
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['action'],
        raw: true
      });

      // Get failure count
      const failureCount = await AuditLog.count({
        where: { ...where, status: 'FAILURE' }
      });

      // Get total count
      const totalCount = await AuditLog.count({ where });

      // Get recent failed logins
      const recentFailedLogins = await AuditLog.findAll({
        where: {
          ...where,
          action: 'LOGIN',
          status: 'FAILURE'
        },
        include: [
          {
            association: 'user',
            attributes: ['id', 'email', 'first_name', 'last_name'],
            required: false
          }
        ],
        limit: 10,
        order: [['created_at', 'DESC']]
      });

      return {
        total: totalCount,
        failures: failureCount,
        successRate: totalCount > 0 ? ((totalCount - failureCount) / totalCount * 100).toFixed(2) : 0,
        actionBreakdown: actionCounts,
        recentFailedLogins
      };
    } catch (error) {
      logger.error('Get audit statistics error:', error);
      throw error;
    }
  }

  /**
   * Export audit logs (for compliance)
   */
  async exportLogs(filters = {}) {
    try {
      const where = {};

      if (filters.firm_id) {
        where.firm_id = filters.firm_id;
      }

      if (filters.start_date || filters.end_date) {
        const { Op } = require('sequelize');
        where.created_at = {};
        
        if (filters.start_date) {
          where.created_at[Op.gte] = new Date(filters.start_date);
        }
        
        if (filters.end_date) {
          where.created_at[Op.lte] = new Date(filters.end_date);
        }
      }

      const logs = await AuditLog.findAll({
        where,
        include: [
          {
            association: 'user',
            attributes: ['id', 'email', 'first_name', 'last_name'],
            required: false
          },
          {
            association: 'firm',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return logs;
    } catch (error) {
      logger.error('Export audit logs error:', error);
      throw error;
    }
  }
}

module.exports = new AuditLogService();

