import { errorHandler } from "../utils/errorHandler.js";
import User from "../models/user.model.js";

import validateEmail from "../utils/validateEmail.js";
import bcryptjs from "bcryptjs";
import { JWT_TOKEN } from "../config.js";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return next(errorHandler(400, "Please, fill all input!"));
  }

  if (!validateEmail(email)) {
    return next(errorHandler(400, "Invalid email!"));
  }

  if (password != confirmPassword) {
    return next(errorHandler(400, "Password not match!"));
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });

  const { password: pass, ...rest } = newUser._doc;

  try {
    const emailExist = await User.findOne({ email });

    if (emailExist)
      return next(errorHandler(409, "Email is already registered!"));

    await newUser.save();

    res.status(201).json({ message: "User created succesfully", data: rest });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const validUser = await User.findOne({ email });

    if (!email || !password) {
      return next(errorHandler(400, "Please, fill all input!"));
    }
  
    if (!validateEmail(email)) {
      return next(errorHandler(400, "Invalid email!"));
    }

    if (!validUser) return next(errorHandler(404, "User not found!"));

    const validPassword = bcryptjs.compareSync(password, validUser.password);

    if (!validPassword) return next(errorHandler(401, "Wrong password!"));

    const token = jwt.sign({ id: validUser._id }, JWT_TOKEN, {
      expiresIn: "86400s",
    });

    const { password: pass, ...rest } = validUser._doc;

    res.cookie("access_token", token).status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.status(200).json({ message: "User has been logout!" });
  } catch (error) {
    next(error);
  }
};
