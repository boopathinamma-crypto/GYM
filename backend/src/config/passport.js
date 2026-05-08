const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('../utils/logger');

const setupPassport = () => {
    // ─── Google Strategy ────────────────────────────────────────────────────────
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`,
                scope: ['profile', 'email'],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) return done(new Error('No email from Google profile'), null);

                    const googleId = profile.id;
                    const name = profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`.trim();
                    const avatarUrl = profile.photos?.[0]?.value || '';

                    // ── Find existing user by googleId or email ───────────────────────
                    let user = await User.findOne({ $or: [{ googleId }, { email }] });

                    if (user) {
                        // Link Google account if signing in with matching email for first time
                        if (!user.googleId) {
                            user.googleId = googleId;
                            user.authProvider = 'google';
                            user.isEmailVerified = true;
                            if (avatarUrl && !user.avatar?.url) user.avatar = { url: avatarUrl, publicId: '' };
                            await user.save({ validateBeforeSave: false });
                            logger.info(`Linked Google account to existing user: ${email}`);
                        }
                        return done(null, user);
                    }

                    // ── Create new user ───────────────────────────────────────────────
                    user = await User.create({
                        name,
                        email,
                        googleId,
                        authProvider: 'google',
                        isEmailVerified: true,          // Google emails are already verified
                        avatar: { url: avatarUrl, publicId: '' },
                        // No password needed for Google users
                        password: require('crypto').randomBytes(32).toString('hex'),
                    });

                    logger.info(`New user created via Google OAuth: ${email}`);
                    return done(null, user);

                } catch (error) {
                    logger.error(`Google OAuth error: ${error.message}`);
                    return done(error, null);
                }
            }
        )
    );

    // Minimal serialize/deserialize (we don't use sessions, just needed by passport)
    passport.serializeUser((user, done) => done(null, user._id));
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};

module.exports = { setupPassport };
