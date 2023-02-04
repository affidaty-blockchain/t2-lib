/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
export const NotImplementedProviderError = 'this method is not implemented in TRINCI Provider';
export class TrinciProviderBase {
    static async getAccountData(accountId:string, key:string[] = ['*']):Promise<{[key: string]: Uint8Array }> {
        return Promise.reject(NotImplementedProviderError);
    }

    static async getAccountBalance(accountId:string, tokens:string[] | null = null):Promise<{[key: string]: Uint8Array }> {
        return Promise.reject(NotImplementedProviderError);
    }

    static async getAccountContractHash(accountId:string):Promise<string|null> {
        return Promise.reject(NotImplementedProviderError);
    }

    static async getAccountDataKeys(accountId:string):Promise<string[]> {
        return Promise.reject(NotImplementedProviderError);
    }

    static getTokenRate(token1:string, token2:string):[number, number] {
        return [0, 0];
    }
}
