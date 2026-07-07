import { Request, Response } from "express";
import { CreateTransactionUseCase } from "../../core/usecases/create-transaction.js";
import { MongoTransactionRepository } from "../mongo/transaction.repository.js";

const repository = new MongoTransactionRepository();
const useCase = new CreateTransactionUseCase(repository);

export const handleCreateTransaction = async (req: Request, res: Response) => {
    const { amount, currency } = req.body;
    try {
        const transaction = await useCase.execute(amount, currency);
        res.status(201).json(transaction);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(400).json({ error: message });
    }
}