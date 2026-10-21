const jwt = require('jsonwebtoken');   //checks if user has a valid access token //used to check JWT tokens
module.exports = (req, res, next) => {
  const header = req.headers.authorization || ''; //Gets the Authorization header access token
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) //Checks whether the header is correct
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); //erorrs if its a refresh token
    if (payload.type === 'refresh')
      return res.status(401).json({ error: 'Refresh tokens cannot be used here' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};