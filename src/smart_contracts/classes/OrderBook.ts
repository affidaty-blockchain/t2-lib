/* eslint-disable max-len */
import { SmartContractBase } from '../base/smartConstractBase';

export class OrderBook extends SmartContractBase {
    static hash_ref = new Set<string>([
        '1220af27bdaafcd0ffec8b3bf869b04b831888eec992b5f110840d11349135fee6f9',
    ]);

    static async getOrderBookBalance(objectBalance:any) {
        if (objectBalance) {
            const tokens = Object.keys(objectBalance.data);
            const newBalance:{[key:string]:{data:any, class:typeof SmartContractBase | null}} = {};
            for (const token of tokens) {
                newBalance[token] = {
                    data: objectBalance.data[token],
                    class: await SmartContractBase.getSmartContractClassFromAccountId(token),
                };
            }
            return newBalance;
        }
        return {};
    }
}
