const authService = require('./auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { token, employee } = await authService.login(email, password);
      res.status(200).json({ success: true, data: { token, employee }, message: 'Logged in successfully' });
    } catch (err) { next(err); }
  }

  async getMe(req, res, next) {
    try {
      res.status(200).json({ success: true, data: req.employee });
    } catch (err) { next(err); }
  }

  async logout(req, res, next) {
    try {
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) { next(err); }
  }
}

module.exports = new AuthController();
