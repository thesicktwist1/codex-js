import bcrypt from 'bcrypt';
import db from 'db/conn.js'
import express from 'express';


const router = express.Router();

router.post('/login', async (req, res, next) => {
  const {email, password} = req.body;
  try {
    let usersCollection = await db.collection('users');
    let result = await usersCollection.findOne({email: email});
    let isMatch = await bcrypt.compare(password, result.password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid credentials'));
    }
    res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
});

router.post('/register', async (req, res, next) => {
  const {email, password} = req.body;
  try {
    let usersCollection = await db.collection('users');
    let exists = await usersCollection.countDocuments({email}) > 0;
    if (exists) {
      res.status(401);
      return next(new Error('User already exists'));
    }
  }
})

export default router;
