import * as Mongoose from "mongoose";

export default class DB {
  static connect() {
    const db_url = process.env.MONGO_DB;
    console.log("DB connecting", db_url);
    return Mongoose.connect(db_url, {
      dbName: 'pricevault'
    })
  }
}