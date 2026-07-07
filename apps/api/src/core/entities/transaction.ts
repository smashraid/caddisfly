export class Transaction {
    constructor(
        public readonly id: string,
        public readonly amount: number,
        public readonly currency: string,
        public readonly createdAt: Date = new Date()
    ) {
        if (amount < 0) throw new Error("Transaction amount must be positive");
    }
}