const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  phone_number: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  country_code:{
    type:String,
    required:true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  status:{
    type:Boolean,
    default:true
  },
  type:{
    type:Boolean,
    default:false
  }
});

// export model user with UserSchema
module.exports = mongoose.model("user", UserSchema);
