/**
 * Role-Based Access Control (RBAC) Middleware.
 * Restricts endpoint access strictly to designated roles.
 * Allowed roles: "PATIENT", "DOCTOR", "PHARMACIST", "AUDITOR"
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Forbidden. This action requires one of the following roles: [${allowedRoles.join(', ')}]. Your current role is: ${req.user.role}`
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
