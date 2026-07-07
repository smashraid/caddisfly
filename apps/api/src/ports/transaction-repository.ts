import { Transaction } from "../core/entities/transaction.js";

export interface ITransactionRepository {
    save(transaction: Transaction): Promise<void>;
    findById(id: string): Promise<Transaction | null>;
}