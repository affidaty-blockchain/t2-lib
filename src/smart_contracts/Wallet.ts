/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */
import { Uint64BE } from 'int64-buffer';
import { TrinciProviderBase, NotImplementedProviderError } from './TrinciProvider';
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable class-methods-use-this */
// import { SmartContractBase } from './base/smartConstractBase';
import { SmartContractBase } from './base/smartConstractBase';

export class TrinciWallet {
    accountId:string;

    static TRINCI:typeof TrinciProviderBase;

    constructor(accountId:string) {
        this.accountId = accountId;
    }

    async getSmartConstractHash():Promise<string|null> {
        return (TrinciWallet.TRINCI) ? (TrinciWallet.TRINCI).getAccountContractHash(this.accountId) : Promise.reject(NotImplementedProviderError);
    }

    async getSmartContractClass():Promise<typeof SmartContractBase | null> {
        if ((TrinciWallet.TRINCI as TrinciProviderBase)) {
            return new Promise((resolve, reject) => {
                TrinciWallet.TRINCI.getAccountContractHash(this.accountId).then((hash:string|null) => {
                    resolve(hash ? SmartContractBase.getSmartContractClassFromHash(hash) : null);
                }).catch(reject);
            });
        }
        return Promise.reject(NotImplementedProviderError);
    }

    async getBalances(tokens:string[] = []):Promise<{[key:string]:{data:Uint8Array, class:typeof SmartContractBase}}> {
        if (TrinciWallet.TRINCI) {
            return new Promise<{[key:string]:{data:Uint8Array, class:typeof SmartContractBase}}>((resolve, reject) => {
                TrinciWallet.TRINCI.getAccountBalance(this.accountId, tokens).then((balances) => {
                    const promisesBalances = Object.entries(balances).map((item) => {
                        return [item[0], item[1], SmartContractBase.getSmartContractClassFromAccountId(item[0])];
                    });
                    Promise.all(promisesBalances.map((d) => { return d[2]; })).then((results) => {
                        const preBalances = results.map((r, index) => { return [promisesBalances[index][0], { data: promisesBalances[index][1], class: r }]; });
                        resolve(Object.fromEntries(preBalances));
                    }).catch(reject);
                }).catch(reject);
            });
        }
        return Promise.reject(NotImplementedProviderError);
    }

    async getBalancesAsNumber(tokens:string[] = []):Promise<{[key:string]:{data:Uint64BE, class:typeof SmartContractBase}}> {
        if ((TrinciWallet.TRINCI as TrinciProviderBase)) {
            return this.getBalances(tokens).then((balances) => {
                return Object.fromEntries(Object.entries(balances).map((item) => {
                    return [item[0], { data: item[1].class.getBalanceAsNumber(item[1].data), class: item[1].class }];
                }));
            });
        }
        return Promise.reject(NotImplementedProviderError);
    }

    async getBalancesAsNumberComparedWithToken(tokens:string[] = [], comparedToken:string = '#EURS'):Promise<{[key:string]:{data:Uint64BE, rate:[number, number], class:typeof SmartContractBase}}> {
        if ((TrinciWallet.TRINCI as TrinciProviderBase)) {
            return this.getBalances(tokens).then((balances) => {
                return Object.fromEntries(Object.entries(balances).map((item) => {
                    return [item[0], { data: item[1].class.getBalanceAsNumber(item[1].data), rate: TrinciWallet.TRINCI.getTokenRate(item[0], comparedToken), class: item[1].class }];
                }));
            });
        }
        return Promise.reject(NotImplementedProviderError);
    }

    async getBalancesAsObject<T>(tokens:string[] = []):Promise<{[key:string]:{data:T, class:typeof SmartContractBase}}> {
        if ((TrinciWallet.TRINCI as TrinciProviderBase)) {
            return this.getBalances(tokens).then((balances) => {
                return Object.fromEntries(Object.entries(balances).map((item) => {
                    return [item[0], { data: item[1].class.getBalanceAsObject<T>(item[1].data), class: item[1].class }];
                }));
            });
        }
        return Promise.reject(NotImplementedProviderError);
    }

    async getData(keys:string[] = []):Promise<any> {
        if (TrinciWallet.TRINCI) {
            return new Promise((resolve, reject) => {
                if (keys.length > 0) {
                    TrinciWallet.TRINCI.getAccountDataKeys(this.accountId).then((keysFounded) => {
                        TrinciWallet.TRINCI.getAccountData(this.accountId, keysFounded).then(resolve).catch(reject);
                    });
                } else {
                    TrinciWallet.TRINCI.getAccountDataKeys(this.accountId).then((keysFounded) => {
                        TrinciWallet.TRINCI.getAccountData(this.accountId, keysFounded.filter((k) => { return keys.includes(k); })).then(resolve).catch(reject);
                    });
                }
            });
        }
        return Promise.reject(NotImplementedProviderError);
    }
}
