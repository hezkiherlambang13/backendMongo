export const notFound = (req, res, next) => {
res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};
export const errorHandler = (err, req, res, next) => {
console.error(err); // di produksi bisa ganti ke logger (Winston/Pino)
const status = res.statusCode !== 200 ? res.statusCode : 500;
res.status(status).json({
message: err.message || "Internal Server Error",
stack: process.env.NODE_ENV === "production" ? " " : err.stack
});
};