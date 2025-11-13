const { body, param } = require('express-validator');

const createHomeRentValidator = [
  body('contractNumber')
    .notEmpty().withMessage('Contract number is required')
    .trim()
    .escape(),

  body('contractStartingDate')
    .notEmpty().withMessage('Contract starting date is required')
    .isISO8601().withMessage('Invalid contract starting date format'),

  body('contractEndingDate')
    .notEmpty().withMessage('Contract ending date is required')
    .isISO8601().withMessage('Invalid contract ending date format'),

  body('notice')
    .optional()
    .trim(),

  body('paymentTerms')
    .optional()
    .trim(),

  body('paymentType')
    .optional()
    .trim(),

  body('paymentStatus')
    .optional()
    .trim(),

  body('amount')
    .optional()
    .isNumeric().withMessage('Amount must be a number'),

  body('rentAnnually')
    .optional()
    .isNumeric().withMessage('Rent annually must be a number'),

  body('address')
    .optional()
    .trim(),

  body('contactPerson')
    .optional()
    .trim(),

  body('gtsContact')
    .optional()
    .trim(),

  body('comments')
    .optional()
    .trim()
];

const updateHomeRentValidator = [
  param('id')
    .isMongoId().withMessage('Invalid home rent ID'),

  ...createHomeRentValidator
];

const deleteHomeRentValidator = [
  param('id')
    .isMongoId().withMessage('Invalid home rent ID')
];

module.exports = {
  createHomeRentValidator,
  updateHomeRentValidator,
  deleteHomeRentValidator
};
