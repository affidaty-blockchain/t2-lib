import { encode as mpEncode, decode as mpDecode } from 'msgpack-lite';
import { Uint64BE } from 'int64-buffer';
import { TrinciWallet } from '../Wallet';

export class SmartContractBase {
    static hash_ref = new Set<string>();

    static mpEncode = mpEncode;

    static mpDencode = mpDecode;

    static SC_CACHE = new Map<string, typeof SmartContractBase>();

    static getSmartContractClassFromHash(hash: string) {
        return this.SC_CACHE.get(hash) || SmartContractBase;
    }

    // eslint-disable-next-line max-len
    static getSmartContractClassFromClassName(className: string):(typeof SmartContractBase) | undefined {
        return [...this.SC_CACHE.values()].find((c) => { return c.name === className; });
    }

    // eslint-disable-next-line max-len
    static async getSmartContractClassFromAccountId(accountId: string):Promise<typeof SmartContractBase | null> {
        if (TrinciWallet.TRINCI) {
            const w = new TrinciWallet(accountId);
            return w.getSmartContractClass();
        }
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject('TrinciProvider not set!');
    }

    static setContract(newContractClass: typeof SmartContractBase, hash?: string) {
        if (hash) newContractClass.hash_ref.add(hash);
        // eslint-disable-next-line max-len
        newContractClass.hash_ref.forEach((h) => { return this.SC_CACHE.set(h, newContractClass); });
    }

    static getWallet(accountId:string):{[key:string]:string} {
        return { TRINCI: accountId };
    }

    static getBalanceAsNumber(data:Uint8Array):Uint64BE {
        return this.mpDencode(data) as Uint64BE;
    }

    static getBalanceAsObject<T>(data:Uint8Array):T {
        return this.mpDencode(data) as T;
    }

    static getLogo() {
        return 'https://us.123rf.com/450wm/urfandadashov/urfandadashov1809/urfandadashov180901275/urfandadashov180901275.jpg?ver=6';
    }
}
