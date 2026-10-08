const { Joi, phone } = require('./common');

const password = Joi.string()
  .min(8)
  .max(72) // bcrypt only uses the first 72 bytes
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[0-9]/, 'number')
  .messages({
    'string.pattern.name': 'password must contain at least one {#name} character',
  });

const register = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().lowercase().email().max(254).required(),
    password: password.required(),
    phone: phone.required(),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().max(72).required(),
  }),
};

const updateProfile = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80),
    phone,
  }).min(1),
};

const changePassword = {
  body: Joi.object({
    currentPassword: Joi.string().max(72).required(),
    newPassword: password.required(),
  }),
};

module.exports = { register, login, updateProfile, changePassword, password };
