import * as Mongoose from "mongoose";

const instrumentType = new Mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  serviceFrequency: {
    type: String,
    required: true
  },
  pricingTZ: {
    type: String,
    required: true
  },
  pricingTime: {
    type: String,
    required: true
  },
  assetId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'assets'
  },
  userId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
},{ timestamps: { createdAt: 'createdAt' } })

export default Mongoose.model("instrumentType", instrumentType);