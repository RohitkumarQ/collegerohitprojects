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
  async (req, res) => {
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
      if (username == "") {
        return res.status(400).json({
          status: 400,
          msg: "username is empty"
        });
      }
      if (phone_number == "") {
        return res.status(400).json({
          status: 400,
          msg: "phone number is empty"
        });
      }
      if (phone_number.length < 8) {
        return res.status(400).json({
          status: 400,
          msg: "enter atlest 8 digit number"
        });
      }
      if (phone_number.length > 12) {
        return res.status(400).json({
          status: 400,
          msg: "enter atmost 12 digit number"
        });
      }
      var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
      if (reg.test(email) == false) {
        return res.status(400).json({
          status: 400,
          msg: "enter valid email"
        });
      }
      if (email == "") {
        return res.status(400).json({
          status: 400,
          msg: "enter is empty"
        });
      }
      if (email !== "") {
        User.findOne({
          email: req.body.email,
        }).then(user => {
          if (user) {
            return res.status(400).json({
              status: 400,
              msg: 'email is already in use'
            })
          }
        })
      }
      if (country_code == "") {
        return res.status(200).json({
          status: 200,
          msg: "country_code is empty"
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          status: 400,
          msg: "enter ialtest 6 digit password"
        });
      }
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
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

