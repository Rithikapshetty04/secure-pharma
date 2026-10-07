const rateLimit = require("express-rate-limit");

/**
 * Authentication endpoints rate limiter
 * Protects login, registration, and password reset flows from brute force attacks
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "test" ? 1000 : 150, // Allow sufficient headroom for multi-stakeholder testing & operations
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many authentication attempts from this IP address. Please try again after 15 minutes.",
  },
});

/**
 * Public Verification rate limiter
 * Prevents automated batch enumeration / scraping of public QR verification
 */
const verificationRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 verification queries per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests from this IP. Please slow down your scan rate.",
  },
});

module.exports = {
  authRateLimiter,
  verificationRateLimiter,
};
