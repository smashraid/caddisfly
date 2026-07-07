import { Transaction, TransactionStatus, TransactionRepositoryPort } from "@caddisfly/domain";
import { TransactionModel } from "../models/transaction.js";

export class MongoTransactionAdapter implements TransactionRepositoryPort {
    constructor(private readonly connectionString: string) { }

    async save(transaction: Transaction): Promise<void> {
        await TransactionModel.create({
            _id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            createdAt: transaction.createdAt
        });
    }

    async findById(id: string): Promise<Transaction | null> {
        const doc = await TransactionModel.findById(id).lean();
        if (!doc) return null;
        return new Transaction(
            doc._id, 
            doc.amount, 
            doc.currency, 
            doc.status as TransactionStatus, 
            doc.createdAt);
    }
}