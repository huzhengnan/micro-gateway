import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

type TokenPayload = {
  userId: string;
  role: string;
};

export async function verifyToken(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return { success: false, message: "No token provided" };
    }
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    // 只校验 token，不查数据库
    return { success: true, userId: decoded.userId, role: decoded.role };
  } catch (error) {
    console.error("Token verification error:", error);
    return { success: false, message: "Invalid token" };
  }
}

export function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "24h" });
}