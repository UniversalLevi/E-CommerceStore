import Joi from 'joi';

export const createServiceOrderSchema = Joi.object({
  serviceType: Joi.string().valid('ads_management', 'connect_experts').required(),
  planType: Joi.string().valid('monthly', 'quarterly', 'yearly', 'lifetime').required(),
  targetGoal: Joi.number().min(0).optional(), // Optional, only for connect_experts
});

export const updateServiceOrderSchema = Joi.object({
  status: Joi.string().valid('active', 'expired', 'cancelled').optional(),
  paymentStatus: Joi.string().valid('pending', 'paid', 'failed', 'refunded').optional(),
});
