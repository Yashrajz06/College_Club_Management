"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AlgorandService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgorandService = void 0;
const common_1 = require("@nestjs/common");
const algosdk = __importStar(require("algosdk"));
let AlgorandService = AlgorandService_1 = class AlgorandService {
    logger = new common_1.Logger(AlgorandService_1.name);
    algodClient;
    masterAccount;
    constructor() {
        this.algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        this.masterAccount = algosdk.generateAccount();
        this.logger.log(`Algorand Service initialized. Local Demo Account: ${this.masterAccount.addr}`);
    }
    async logTransactionToLedger(amount, type, description) {
        try {
            this.logger.log(`Preparing to log transaction to Algorand: ${type} $${amount}`);
            let params;
            try {
                params = await this.algodClient.getTransactionParams().do();
            }
            catch (e) {
                params = {
                    fee: 1000,
                    firstValid: 10000,
                    lastValid: 11000,
                    genesisID: 'testnet-v1.0',
                    genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
                };
            }
            const noteData = new TextEncoder().encode(`CampusClubs TX | Type: ${type} | Amount: $${amount} | Desc: ${description}`);
            const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                sender: this.masterAccount.addr,
                receiver: this.masterAccount.addr,
                amount: 0,
                note: noteData,
                suggestedParams: params,
            });
            const txId = txn.txID();
            this.logger.log(`Successfully generated Blockchain TXN Hash: ${txId}`);
            return txId;
        }
        catch (error) {
            this.logger.error(`Failed to log transaction to Algorand: ${error.message}`);
            return `MOCK-TXN-${Date.now()}`;
        }
    }
};
exports.AlgorandService = AlgorandService;
exports.AlgorandService = AlgorandService = AlgorandService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AlgorandService);
//# sourceMappingURL=algorand.service.js.map