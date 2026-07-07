import { Transaction } from "../entities/transaction.js";
import { ITransactionRepository } from "../../ports/repository.js";
import { logger } from "@caddisfly/logger";

export class CreateTransactionUseCase {
    constructor(private readonly repo: ITransactionRepository) { }

    async execute(amount: number, currency: string): Promise<Transaction> {
        const transaction = new Transaction(crypto.randomUUID(), amount, currency);
        logger.info("Saving transaction to repository")
        await this.repo.save(transaction);
        return transaction;
    }
}