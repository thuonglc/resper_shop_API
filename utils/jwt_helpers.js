import creatError from 'http-errors';
import JWT from 'jsonwebtoken';
import User from '../models/userModel.js';

export function signAccessToken(id) {
  return new Promise((resolve, reject) => {
    const options = {
      expiresIn: '30d',
    };
    JWT.sign({ id }, process.env.ACCESS_TOKEN_SECRET, options, (err, token) => {
      if (err) reject(creatError.InternalServerError());
      resolve(token);
    });
  });
}

export function signRefreshToken(id) {
  return new Promise((resolve, reject) => {
    const options = {
      // expiresIn: '16s',
    };
    JWT.sign({ id }, process.env.REFRESH_TOKEN_SECRET, options, (err, token) => {
      if (err) reject(creatError.InternalServerError());
      resolve(token);
    });
  });
}

export function verilyRefreshToken(refreshToken) {
  return new Promise((resolve, reject) => {
    JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return next(creatError.Unauthorized());
    });
  });
}

export function verifyAccessToken(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) return next(creatError.Unauthorized());
  try {
    const verified = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.data = verified;
    next();
  } catch {
    res.status(400).send('Invalid token');
  }
}

export async function verifyAdminRole(req, res, next) {
  const { email } = req.data.id;
  const adminUser = await User.findOne({ email }).exec();
  if (adminUser.role !== 1) {
    res.status(403).json({
      err: 'Admin resource. Access denied.',
    });
  } else {
    next();
  }
}
