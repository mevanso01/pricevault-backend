import * as Mongoose from "mongoose";

const user = new Mongoose.Schema({
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  email_verified: {
    type: Boolean
  },
  email_token: {
    type: String
  },
  email_token_exp_at: {
    type: Date
  },
  sms_verified: {
    type: Boolean
  },
  sms_token: {
    type: String
  },
  sms_exp_at: {
    type: Date
  }
})

export default Mongoose.model("user", user);