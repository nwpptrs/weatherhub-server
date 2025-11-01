const authService = require("../services/authService");

class AuthController {
  async login(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "กรุณาระบุรหัสผ่าน" });
      }

      const auth = await authService.authenticate(password);

      res.json({
        message: "เข้าสู่ระบบสำเร็จ",
        token: auth.token,
        expiresIn: auth.expiresIn,
      });
    } catch (error) {
      console.error("Login Error:", error);

      if (error.message === "Invalid credentials") {
        return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
      }

      res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
    }
  }

  // Middleware
  protect(req, res, next) {
    try {
      const token = authService.extractToken(req.headers.authorization);
      const decoded = authService.verifyToken(token);

      req.user = decoded;
      next();
    } catch (error) {
      console.error("Auth Error:", error);

      const status = error.message.includes("No token") ? 401 : 403;
      const message =
        error.message === "No token provided"
          ? "ไม่พบ Token สำหรับการยืนยันตัวตน"
          : "Token ไม่ถูกต้องหรือหมดอายุ";

      res.status(status).json({ error: message });
    }
  }
}

module.exports = new AuthController();
