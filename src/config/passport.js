const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const tokenService = require('../services/tokenService');

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findByPk(payload.id);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          where: {
            provider: 'google',
            providerId: profile.id,
          },
        });

        if (!user) {
          // Check if email already exists
          const existingUser = await User.findOne({
            where: { email: profile.emails[0].value },
          });

          if (existingUser) {
            return done(null, false, {
              message: 'Email already registered with different provider',
            });
          }

          user = await User.create({
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            provider: 'google',
            providerId: profile.id,
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          where: {
            provider: 'github',
            providerId: profile.id.toString(),
          },
        });

        if (!user) {
          // GitHub may not provide email in profile
          const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;

          // Check if email already exists
          const existingUser = await User.findOne({
            where: { email },
          });

          if (existingUser) {
            return done(null, false, {
              message: 'Email already registered with different provider',
            });
          }

          const nameParts = profile.displayName?.split(' ') || [profile.username, ''];
          user = await User.create({
            email,
            firstName: nameParts[0] || profile.username,
            lastName: nameParts.slice(1).join(' ') || '',
            provider: 'github',
            providerId: profile.id.toString(),
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;

