import * as Mongoose from "mongoose";

const submission = new Mongoose.Schema({
  tradeId: {
    type: Number,
    required: true
  },
  valuation: {
    type: Number,
    required: true
  },
  forward: Number,
  userId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
},{ timestamps: { createdAt: 'createdAt' } })

export default Mongoose.model("submission", submission);