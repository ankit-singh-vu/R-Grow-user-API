const { sign } = require('jsonwebtoken');

module.exports = {
  // Create tokens
  createAccessToken: (userId) => {
    return sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '43200m', //30 days
    });
  },

  createRefreshToken: (userId) => {
    return sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: '1d',
    });
  },
  // Send tokens
  sendAccessToken: (res, req, accesstoken) => {
    res.send({
      accesstoken,
      email: req.body.email,
    });
  },

  sendRefreshToken: (res, token) => {
    res.cookie('refreshtoken', token, {
      httpOnly: true,
      // path: '/refresh_token',
      path: '/',
    });
  }
}