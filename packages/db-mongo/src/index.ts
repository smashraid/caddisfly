import mongoose from "mongoose";
export * from "./models/transaction.model.js"

export const connectMongo = async (uri: string) => {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
}