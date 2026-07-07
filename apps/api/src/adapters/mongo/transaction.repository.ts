import { Transaction } from "../../core/entities/transaction.js";
import { ITransactionRepository } from "../../ports/repository.js";
import { TransactionModel } from "@caddisfly/db-mongo";

export class MongoTransactionRepository implements ITransactionRepository {
    async save(transaction: Transaction): Promise<void> {
        await TransactionModel.create({
            _id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            createdAt: transaction.createdAt
        });
    }

    async findById(id: string): Promise<Transaction | null> {
        const doc = await TransactionModel.findById(id);
        if (!doc) return null;
        return new Transaction(doc._id, doc.amount, doc.currency, doc.createdAt);
    }

}