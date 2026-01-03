const { IndependenceDeclaration, Engagement, User } = require('../models');
const authService = require('./authService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class IndependenceService {
  /**
   * Add user to declare independence for an engagement
   * Only engagement partner or manager can add users
   */
  async addUserForDeclaration(engagementId, userIdToAdd, addedBy) {
    try {
      // Get engagement
      const engagement = await Engagement.findByPk(engagementId, {
        include: [
          { model: User, as: 'engagementPartner' },
          { model: User, as: 'engagementManager' }
        ]
      });

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      // Check if addedBy is engagement partner or manager
      const isPartner = engagement.engagement_partner_id === addedBy;
      const isManager = engagement.engagement_manager_id === addedBy;

      if (!isPartner && !isManager) {
        throw new Error('Only engagement partner or manager can add users to declare independence');
      }

      // Verify user to add exists and belongs to same firm
      const user = await User.findByPk(addedBy);
      const userToAdd = await User.findByPk(userIdToAdd);

      if (!userToAdd) {
        throw new Error('User to add not found');
      }

      if (userToAdd.firm_id !== user.firm_id) {
        throw new Error('User does not belong to the same firm');
      }

      // Check if declaration already exists
      const existing = await IndependenceDeclaration.findOne({
        where: {
          engagement_id: engagementId,
          user_id: userIdToAdd
        }
      });

      if (existing) {
        throw new Error('User has already been added to declare independence for this engagement');
      }

      // Create placeholder declaration (user needs to fill it)
      const declaration = await IndependenceDeclaration.create({
        engagement_id: engagementId,
        user_id: userIdToAdd,
        is_independent: false, // Default, user must declare
        status: 'PENDING',
        added_by: addedBy
      });

      // Log action
      await authService.logAuditEvent(
        addedBy,
        user.firm_id,
        'ADD_USER_FOR_INDEPENDENCE',
        'INDEPENDENCE_DECLARATION',
        declaration.id,
        { engagement_id: engagementId, user_id: userIdToAdd },
        null,
        null,
        'SUCCESS'
      );

      return declaration;
    } catch (error) {
      logger.error('Add user for declaration error:', error);
      throw error;
    }
  }

  /**
   * Submit independence declaration
   */
  async submitDeclaration(declarationId, declarationData, userId) {
    try {
      const declaration = await IndependenceDeclaration.findByPk(declarationId);

      if (!declaration) {
        throw new Error('Declaration not found');
      }

      // Only the user who was added can submit their own declaration
      if (declaration.user_id !== userId) {
        throw new Error('You can only submit your own independence declaration');
      }

      const user = await User.findByPk(userId);

      // Update declaration
      await declaration.update({
        is_independent: declarationData.is_independent,
        conflicts_disclosed: declarationData.conflicts_disclosed || null,
        safeguards_applied: declarationData.safeguards_applied || null,
        declaration_period_start: declarationData.declaration_period_start,
        declaration_period_end: declarationData.declaration_period_end,
        declaration_date: new Date(),
        status: declarationData.is_independent ? 'APPROVED' : 'REQUIRES_REVIEW'
      });

      // Log submission
      await authService.logAuditEvent(
        userId,
        user.firm_id,
        'SUBMIT_INDEPENDENCE_DECLARATION',
        'INDEPENDENCE_DECLARATION',
        declaration.id,
        { is_independent: declarationData.is_independent },
        null,
        null,
        'SUCCESS'
      );

      // TODO: Save to SharePoint "juggernaut" folder
      // This would integrate with SharePoint API
      // For now, we'll create a placeholder URL
      const sharepointUrl = await this.saveToSharePoint(declaration);
      await declaration.update({ sharepoint_file_url: sharepointUrl });

      return await this.getDeclaration(declarationId, userId);
    } catch (error) {
      logger.error('Submit declaration error:', error);
      throw error;
    }
  }

  /**
   * Get independence declaration by ID
   */
  async getDeclaration(declarationId, userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const declaration = await IndependenceDeclaration.findByPk(declarationId, {
        include: [
          { 
            model: Engagement, 
            as: 'engagement',
            include: [
              { model: User, as: 'engagementPartner', attributes: ['id', 'first_name', 'last_name', 'email'] },
              { model: User, as: 'engagementManager', attributes: ['id', 'first_name', 'last_name', 'email'] }
            ]
          },
          { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'designation'] },
          { model: User, as: 'addedBy', attributes: ['id', 'first_name', 'last_name', 'email'] },
          { model: User, as: 'reviewer', attributes: ['id', 'first_name', 'last_name', 'email'] }
        ]
      });

      if (!declaration) {
        throw new Error('Declaration not found');
      }

      // Check access: user themselves, partner, or manager
      const isOwnDeclaration = declaration.user_id === userId;
      const isPartner = declaration.engagement.engagement_partner_id === userId;
      const isManager = declaration.engagement.engagement_manager_id === userId;

      if (!isOwnDeclaration && !isPartner && !isManager) {
        throw new Error('Access denied to this declaration');
      }

      return declaration;
    } catch (error) {
      logger.error('Get declaration error:', error);
      throw error;
    }
  }

  /**
   * List declarations for a user (their own declarations)
   */
  async listMyDeclarations(userId, filters = {}) {
    try {
      const where = { user_id: userId };

      if (filters.status) {
        where.status = filters.status;
      }

      const declarations = await IndependenceDeclaration.findAll({
        where,
        include: [
          { 
            model: Engagement, 
            as: 'engagement',
            attributes: ['id', 'name', 'client_name', 'start_date', 'end_date']
          },
          { model: User, as: 'addedBy', attributes: ['id', 'first_name', 'last_name', 'email'] }
        ],
        order: [['created_at', 'DESC']]
      });

      return declarations;
    } catch (error) {
      logger.error('List my declarations error:', error);
      throw error;
    }
  }

  /**
   * List declarations for an engagement (for partners/managers)
   */
  async listEngagementDeclarations(engagementId, userId) {
    try {
      const engagement = await Engagement.findByPk(engagementId);

      if (!engagement) {
        throw new Error('Engagement not found');
      }

      // Check if user is partner or manager
      const isPartner = engagement.engagement_partner_id === userId;
      const isManager = engagement.engagement_manager_id === userId;

      if (!isPartner && !isManager) {
        throw new Error('Only engagement partner or manager can view all declarations');
      }

      const declarations = await IndependenceDeclaration.findAll({
        where: { engagement_id: engagementId },
        include: [
          { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'designation'] },
          { model: User, as: 'addedBy', attributes: ['id', 'first_name', 'last_name', 'email'] },
          { model: User, as: 'reviewer', attributes: ['id', 'first_name', 'last_name', 'email'] }
        ],
        order: [['created_at', 'DESC']]
      });

      return declarations;
    } catch (error) {
      logger.error('List engagement declarations error:', error);
      throw error;
    }
  }

  /**
   * Review independence declaration (by partner/manager)
   */
  async reviewDeclaration(declarationId, reviewData, reviewedBy) {
    try {
      const declaration = await IndependenceDeclaration.findByPk(declarationId, {
        include: [{ model: Engagement, as: 'engagement' }]
      });

      if (!declaration) {
        throw new Error('Declaration not found');
      }

      const engagement = declaration.engagement;

      // Check if reviewer is partner or manager
      const isPartner = engagement.engagement_partner_id === reviewedBy;
      const isManager = engagement.engagement_manager_id === reviewedBy;

      if (!isPartner && !isManager) {
        throw new Error('Only engagement partner or manager can review declarations');
      }

      const user = await User.findByPk(reviewedBy);

      // Update declaration with review
      await declaration.update({
        status: reviewData.status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
        reviewer_notes: reviewData.reviewer_notes || null
      });

      // Log review
      await authService.logAuditEvent(
        reviewedBy,
        user.firm_id,
        'REVIEW_INDEPENDENCE_DECLARATION',
        'INDEPENDENCE_DECLARATION',
        declaration.id,
        { status: reviewData.status },
        null,
        null,
        'SUCCESS'
      );

      return await this.getDeclaration(declarationId, reviewedBy);
    } catch (error) {
      logger.error('Review declaration error:', error);
      throw error;
    }
  }

  /**
   * Get engagements where user is partner or manager
   * (For Independence Tool access)
   */
  async getEngagementsForUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const engagements = await Engagement.findAll({
        where: {
          firm_id: user.firm_id,
          [Op.or]: [
            { engagement_partner_id: userId },
            { engagement_manager_id: userId }
          ]
        },
        include: [
          { model: User, as: 'engagementPartner', attributes: ['id', 'first_name', 'last_name', 'email'] },
          { model: User, as: 'engagementManager', attributes: ['id', 'first_name', 'last_name', 'email'] }
        ],
        order: [['created_at', 'DESC']]
      });

      return engagements;
    } catch (error) {
      logger.error('Get engagements for user error:', error);
      throw error;
    }
  }

  /**
   * Save declaration to SharePoint juggernaut folder
   * TODO: Implement actual SharePoint integration
   */
  async saveToSharePoint(declaration) {
    try {
      // Placeholder for SharePoint integration
      // In production, this would:
      // 1. Connect to SharePoint API using credentials
      // 2. Navigate to engagement's juggernaut folder
      // 3. Generate PDF of declaration
      // 4. Upload file
      // 5. Return SharePoint URL

      const engagement = await Engagement.findByPk(declaration.engagement_id);
      const user = await User.findByPk(declaration.user_id);
      
      // Generate placeholder URL
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `independence_${user.last_name}_${user.first_name}_${timestamp}.pdf`;
      const placeholderUrl = `sharepoint://juggernaut/${engagement.name}/${filename}`;

      logger.info(`[PLACEHOLDER] Would save declaration to SharePoint: ${placeholderUrl}`);

      return placeholderUrl;
    } catch (error) {
      logger.error('Save to SharePoint error:', error);
      // Don't throw - allow declaration to succeed even if SharePoint fails
      return 'sharepoint://pending';
    }
  }
}

module.exports = new IndependenceService();

