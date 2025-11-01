const jwt = require("jsonwebtoken");

class AuthService {
  constructor() {
    this.config = {
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: "1h",
      mockPassword: "admin",
    };
  }
  async authenticate(password) {
    if (!this._validateCredentials(password)) {
      throw new Error("Invalid credentials");
    }

    const token = this._generateToken();
    return {
      token,
      expiresIn: this.config.jwtExpiresIn,
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.config.jwtSecret);
    } catch (err) {
      throw new Error("Invalid or expired token");
    }
  }

  extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No token provided");
    }
    return authHeader.split(" ")[1];
  }

  _validateCredentials(password) {
    return password && password === this.config.mockPassword;
  }

  _generateToken() {
    const payload = {
      id: 1,
      role: "admin",
    };

    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
    });
  }
}

module.exports = new AuthService();
