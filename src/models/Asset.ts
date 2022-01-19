import * as Mongoose from "mongoose";

const asset = new Mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
},{ timestamps: { createdAt: 'createdAt' } })

export default Mongoose.model("asset", asset);