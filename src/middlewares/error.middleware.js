// ============================================================
// server/src/middlewares/error.middleware.js
// ============================================================
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route tidak ditemukan: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};


// ============================================================
// server/src/middlewares/roleCheck.middleware.js
// ============================================================
// export const roleCheck = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user)
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     if (!allowedRoles.includes(req.user.role))
//       return res.status(403).json({
//         success: false,
//         message: `Akses ditolak. Role yang diizinkan: ${allowedRoles.join(' atau ')}`,
//       });
//     next();
//   };
// };