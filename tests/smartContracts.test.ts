/* eslint-disable max-len */
// eslint-disable-next-line max-classes-per-file
import { HMAC } from 'fast-sha256';
import { SmartContractLoader } from '../src/smart_contracts/SmartContractLoader';
import { TrinciProviderBase } from '../src/smart_contracts/TrinciProvider';
import { AdvancedAsset } from '../src/smart_contracts/classes/AdvancedAsset';
import { TrinciWallet } from '../src/smart_contracts/Wallet';
import { SmartContractBase } from '../src/smart_contracts/base/smartConstractBase';
import { Eurs } from '../src/smart_contracts/classes/Eurs';
import { OrderBook } from '../src/smart_contracts/classes/OrderBook';

const util = require('util');

SmartContractLoader.INIT();
class SimpleTrinciProvider extends TrinciProviderBase {
    static SC_CACHE:Map<string, string> = new Map();

    static TRINCI_CONTRACT_DB: Map<string, string> = new Map();

    static TRINCI_ACCOUNT_DB: Map<string, {[key:string]:Uint8Array}> = new Map();

    static TRINCI_DATA_DB: Map<string, {[key:string]:Uint8Array}> = new Map();

    static TRINCI_LAST_EXCHANGE_DB: Map<string, [number, number]> = new Map();

    static async getAccountDataKeys(accountId:string):Promise<string[]> {
        return this.TRINCI_DATA_DB.has(accountId) ? Promise.resolve(Object.keys(this.TRINCI_DATA_DB.get(accountId)!)) : Promise.resolve([]);
    }

    static async getAccountBalance(accountId:string, tokens:string[] = []):Promise<{[key: string]: Uint8Array }> {
        if (this.TRINCI_ACCOUNT_DB.has(accountId)) {
            if (tokens.length > 0) {
                const balance = this.TRINCI_ACCOUNT_DB.get(accountId)!;
                return Promise.resolve(Object.entries(balance)
                    .filter(([key]) => { return tokens.includes(key); })
                    .reduce((acc, [key, value]) => { return { ...acc, [key]: value }; }, {}));
            }
            return Promise.resolve(this.TRINCI_ACCOUNT_DB.get(accountId)!);
        }
        return {};
    }

    static async getAccountContract(accountId:string):Promise<string | null> {
        if (this.SC_CACHE.has(accountId)) return Promise.resolve(this.SC_CACHE.get(accountId)!);
        return Promise.resolve(null);
    }

    static async getAccountContractHash(accountId:string):Promise<string> {
        if (this.TRINCI_CONTRACT_DB.has(accountId)) {
            return Promise.resolve(this.TRINCI_CONTRACT_DB.get(accountId)!);
        }
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(`SmartContract not found in ${accountId}`);
    }

    static getTokenRate(token1:string, token2:string):[number, number] {
        if (token1 === token2) return [1, 1];
        const tmpKey = [token1, token2];
        tmpKey.sort((a, b) => {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });
        const key = `${tmpKey[0]}:${tmpKey[1]}`;
        console.log(tmpKey, key);
        if (this.TRINCI_LAST_EXCHANGE_DB.has(key)) {
            const rate = this.TRINCI_LAST_EXCHANGE_DB.get(key)!;
            if (tmpKey[0] === token2) {
                return [rate[1], rate[0]];
            }
            return rate;
        }
        return [0, 0];
    }
}

class MOCK_TRINCI_CONNECTOR {
    static setData<T>(accountId:string, key:string, data:T) {
        if (SimpleTrinciProvider.TRINCI_DATA_DB.has(accountId)) {
            const pdata = SimpleTrinciProvider.TRINCI_DATA_DB.get(accountId)!;
            pdata[key] = SmartContractBase.mpEncode(data);
        } else {
            const emptyObject:{[key:string]:Uint8Array} = {};
            emptyObject[key] = SmartContractBase.mpEncode(data);
            SimpleTrinciProvider.TRINCI_DATA_DB.set(accountId, emptyObject);
        }
    }

    static setBalance<T>(accountId:string, token:string, data:T) {
        if (SimpleTrinciProvider.TRINCI_ACCOUNT_DB.has(accountId)) {
            const pdata = SimpleTrinciProvider.TRINCI_ACCOUNT_DB.get(accountId)!;
            pdata[token] = SmartContractBase.mpEncode(data);
        } else {
            const emptyObject:{[key:string]:Uint8Array} = {};
            emptyObject[token] = SmartContractBase.mpEncode(data);
            SimpleTrinciProvider.TRINCI_ACCOUNT_DB.set(accountId, emptyObject);
        }
    }

    static getData<T>(accountId:string, key:string):T {
        if (SimpleTrinciProvider.TRINCI_DATA_DB.has(accountId)) {
            return SmartContractBase.mpEncode(SimpleTrinciProvider.TRINCI_DATA_DB.get(accountId)![key]) as T;
        }
        return null as T;
    }

    static getBalance<T>(accountId:string, token:string):T {
        if (SimpleTrinciProvider.TRINCI_ACCOUNT_DB.has(accountId)) {
            return SmartContractBase.mpEncode(SimpleTrinciProvider.TRINCI_ACCOUNT_DB.get(accountId)![token]) as T;
        }
        return null as T;
    }

    static setToken(token:string, SmartContractClass:typeof SmartContractBase) {
        if (SmartContractClass.hash_ref.size === 0) {
            const h = new HMAC(SmartContractBase.mpEncode(SmartContractClass.name)); // also Hash and HMAC classes
            SmartContractClass.hash_ref.add(h.toString());
        }
        SimpleTrinciProvider.TRINCI_CONTRACT_DB.set(token, [...SmartContractClass.hash_ref.values()][0]);
    }

    static setRate(data:[[string, number], [string, number]]) {
        data.sort((a, b) => {
            if (a[0] < b[0]) return -1;
            if (a[0] > b[0]) return 1;
            return 0;
        });
        const key = `${data[0][0]}:${data[1][0]}`;
        SimpleTrinciProvider.TRINCI_LAST_EXCHANGE_DB.set(key, [data[0][1], data[1][1]]);
    }
}

/**
 * default TRINCI Implementation
 */
TrinciWallet.TRINCI = SimpleTrinciProvider;
MOCK_TRINCI_CONNECTOR.setToken('#BTC', AdvancedAsset);
MOCK_TRINCI_CONNECTOR.setToken('#EURS', Eurs);
MOCK_TRINCI_CONNECTOR.setToken('#OrderBook', OrderBook);
MOCK_TRINCI_CONNECTOR.setData('#BTC', 'init', true);
MOCK_TRINCI_CONNECTOR.setBalance('Luca', '#BTC', 10);
MOCK_TRINCI_CONNECTOR.setBalance('Luca', '#EURS', 10000);
MOCK_TRINCI_CONNECTOR.setBalance('Luca', '#OrderBook', { '#EURS': 10, '#BTC': 40 });
MOCK_TRINCI_CONNECTOR.setRate([['#BTC', 1], ['#EURS', 19245]]);

describe('Testing SmartContract map implementations', () => {
    it('Init classes', async () => {
        expect(SmartContractBase.SC_CACHE.size).toBeGreaterThan(0);
    });
    it('Getting classes by class name', async () => {
        const classSC = SmartContractBase.getSmartContractClassFromClassName('AdvancedAsset');
        expect(classSC?.name).toBe('AdvancedAsset');
    });
    it('Getting classes by constract hash', async () => {
        const classSC = SmartContractBase.getSmartContractClassFromHash('1220f24353dad66c0aea2894956d6d8be2e209d87d7f3c1ff85b92e4bd611087d032');
        expect(classSC?.name).toBe('AdvancedAsset');
    });
    it('Getting balance', async () => {
        const luca = new TrinciWallet('Luca');
        const balance = await luca.getBalancesAsNumberComparedWithToken([], '#EURS');
        expect(balance['#BTC'].data).toBe(10);
    });
    it('Getting OrderBook balance', async () => {
        const luca = new TrinciWallet('Luca');
        const balance = await luca.getBalancesAsObject();

        //  OrderBook.getOrderBookBalance(balance['#OrderBook']).then(console.log);

        expect(balance['#BTC'].data).toBe(10);
    });
});
