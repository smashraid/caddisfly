import mongoose, { Schema } from 'mongoose';

const TransactionSchema = new Schema({
  _id: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const TransactionModel = mongoose.model('Transaction', TransactionSchema);