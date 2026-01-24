import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
  console.log(req.body);
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Field wajib diisi" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email sudah terdaftar" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashed, role: role || "customer"
    });

    res.status(201).json({ message: "Register sukses" });
  } catch (e) { next(e); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Email / password salah" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Email / password salah" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (e) { next(e); }
};
