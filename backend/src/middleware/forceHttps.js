module.exports = (req, res, next) => {
  // Log what we're receiving
  console.log('Request headers:', {
    host: req.headers.host,
    'x-forwarded-proto': req.headers['x-forwarded-proto'],
    'x-forwarded-host': req.headers['x-forwarded-host']
  });
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    req.headers['x-forwarded-proto'] = 'https';
  }
  
  next();
};
