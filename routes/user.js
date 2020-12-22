const express = require("express");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../middlewares/auth");

const User = require("../models/User");

/**
 * @method - POST
 * @param - /signup
 * @description - User SignUp
 */

router.post(
  "/signup",
  check("username", "Please Enter a Valid Username")
    .not()
    .isEmpty(),
  check("phone_number", "Please enter a valid phone_number").isLength({
    min: 8,
    max: 12
  }).isInt(),
  check("email", "Please enter a valid email").isEmail()
    .custom((value, { req, loc, res }) => {
      return User.findOne({
        email: req.body.email,
      }).then(user => {
        if (user) {
          return Promise.reject('email already in use');
        }
      });
    }),
  check("password", "Please enter a valid password").isLength({
    min: 6
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({
        status: 200,
        msg: errors
      });
    }
    const { username, phone_number, email, country_code, password } = req.body;
    try {
      let user = await User.findOne({
        phone_number
      });
      if (user) {
        return res.status(400).json({
          status: 400,
          msg: "phonenumber Already Exists"
        });
      }

      user = new User({
        username,
        phone_number,
        email,
        country_code,
        password
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 10000
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            status: 200,
            msg: "registered succsessfuly",
            data: {
              token
            }

          });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
    }
  }
);


router.post(
  "/login",
  async (req, res) => {
    const { phone_number, password } = req.body;
    try {
      let user = await User.findOne({
        phone_number
      });
      if (!user)
        return res.status(400).json({
          status: 400,
          msg: "phone_number not exist"
        });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({
          status: 400,
          msg: "Incorrect Password !"
        });

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 3600
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            status: 200,
            msg: "login successfuly",
            data: {
              user,
              token
            }

          });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({
        status: 500,
        msg: "Server Error"
      });
    }
  }
);

/**
 * @method - POST
 * @description - Get LoggedIn User
 * @param - /user/me
 */

router.get("/me", auth, async (req, res) => {
  try {
    // request.user is getting fetched from Middleware after token authentication
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (e) {
    res.send({
      status: 400,
      msg: "Error in Fetching user"
    });
  }
});

router.post("/delete", auth, async (req, res) => {
  try {
    // request.user is getting fetched from Middleware after token authentication
    const user = await User.findByIdAndRemove(req.user.id);
    res.json({
      status: 200,
      msg: "user delete successfuly !!"
    });
  } catch (e) {
    res.send({ message: "Error in Fetching user" });
  }
});

router.put("/update", auth, (req, res) => {
  User.findByIdAndUpdate(req.user.id, {
    username: req.body.username,
    phone_number: req.body.phone_number,
    email: req.body.email,
    country_code: req.body.country_code,
    password: req.body.password
  }, { new: true })
    .then(user => {
      if (!user) {
        return res.status(404).send({
          message: "user not found"
        });
      }
      res.send({
        status: 200,
        msg: "user updated successfuly",
        data: {
          user
        }

      });
    }).catch(err => {
      if (err) {
        return res.status(404).send({
          sattus: 404,
          message: "user not found "
        });
      }
      return res.status(500).send({
        status: 500,
        message: "Error updating user "
      });
    });
});

module.exports = router;

