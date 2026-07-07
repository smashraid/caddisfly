import { Transaction } from "../entities/transaction.js";

export interface TransactionRepositoryPort {
    save(transaction: Transaction): Promise<void>;
    findById(id: string): Promise<Transaction | null>;
}