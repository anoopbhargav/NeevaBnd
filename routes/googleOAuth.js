const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-token').Strategy;

passport.serializeUser((user, cb) => {
	cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
	cb(null, id);
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		},
		async (accessToken, refreshToken, profile, cb) => {
			try {
				return cb(null, profile);
			} catch (e) {
				throw new Error(e);
			}
		}
	)
);

module.exports = { passport, session };
