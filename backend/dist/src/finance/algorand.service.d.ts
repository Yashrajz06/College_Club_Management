export declare class AlgorandService {
    private readonly logger;
    private algodClient;
    private masterAccount;
    constructor();
    logTransactionToLedger(amount: number, type: string, description: string): Promise<string>;
}
