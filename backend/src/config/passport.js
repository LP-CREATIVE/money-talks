const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://insightexchange-production.up.railway.app/api/auth/google/callback",
  proxy: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await prisma.user.findUnique({
      where: { email: profile.emails[0].value }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.emails[0].value,
          password: 'oauth-user',
          userType: 'RETAIL',
          organizationName: profile.displayName
        }
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: "https://insightexchange-production.up.railway.app/api/auth/linkedin/callback",
  scope: ['r_emailaddress', 'r_liteprofile'],
  proxy: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await prisma.user.findUnique({
      where: { email: profile.emails[0].value }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.emails[0].value,
          password: 'oauth-user',
          userType: 'RETAIL',
          organizationName: profile.displayName
        }
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

module.exports = passport;
