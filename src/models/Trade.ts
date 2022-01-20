import * as Mongoose from "mongoose";

const trade = new Mongoose.Schema({
  tradeId: {
    type: Number,
    required: true,
    unique: true
  },
  underlying: {
    type: String
  },
  onshoreOffshore: {
    type: String
  },
  collateralConvention: {
    type: String
  },
  settlementType: {
    type: String
  },
  priceConvention: {
    type: String
  },
  expiry: {
    type: String,
    required: true
  },
  tenor: {
    type: String,
    required: true
  },
  strikeRelative: {
    type: Number,
    required: true
  },
  strikeFixed: {
    type: Number
  },
  exerciseType: {
    type: String
  },
  optionType: {
    type: String,
    required: true,
    enum: ["r", "p", "s"]
  },
  swapFixedDCC: {
    type: String,
  },
  swapFixedFrequency: {
    type: String,
  },
  swapFloatDCC: {
    type: String,
  },
  instrumentTypeId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'instrumentTypes',
  },
  userId: {
    type: Mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
},{ timestamps: { createdAt: 'createdAt' } })

export default Mongoose.model("trade", trade);