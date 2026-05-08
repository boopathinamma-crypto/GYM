const { AppError } = require('./error.middleware');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(
        `Role '${req.user.role}' is not authorized to access this resource.`,
        403
      ));
    }
    next();
  };
};

const authorizeOrSelf = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    const isSelf = req.params.id && req.params.id === req.user._id.toString();
    const hasRole = roles.includes(req.user.role);
    if (!isSelf && !hasRole) {
      return next(new AppError('Not authorized to access this resource.', 403));
    }
    next();
  };
};

module.exports = { authorize, authorizeOrSelf };
