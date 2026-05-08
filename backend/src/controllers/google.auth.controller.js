const User = require('../models/User');
const { generateTokenPair } = require('../utils/jwt');
const { sanitizeUser } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─── Called after passport.authenticate('google') succeeds ───────────────────
exports.googleCallback = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            logger.error('Google OAuth: no user in request');
            return res.redirect(`${CLIENT_URL}/login?error=google_failed`);
        }

        // Generate JWT pair
        const { accessToken, refreshToken } = generateTokenPair(user);

        // Store refresh token
        await User.findByIdAndUpdate(user._id, {
            $push: { refreshTokens: refreshToken },
            lastLogin: new Date(),
        });

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

        // Redirect to frontend with access token in URL
        // Frontend reads it from URL, stores it, then removes from URL
        const redirectUrl = `${CLIENT_URL}/auth/google/success?token=${accessToken}&provider=google`;
        logger.info(`Google OAuth success for ${user.email} → redirecting`);
        return res.redirect(redirectUrl);

    } catch (error) {
        logger.error(`Google callback error: ${error.message}`);
        return res.redirect(`${CLIENT_URL}/login?error=server_error`);
    }
});

// ─── Google OAuth failure handler ────────────────────────────────────────────
exports.googleFailed = (req, res) => {
    const reason = req.query.error || 'access_denied';
    logger.warn(`Google OAuth failed: ${reason}`);
    res.redirect(`${CLIENT_URL}/login?error=${reason}`);
};
