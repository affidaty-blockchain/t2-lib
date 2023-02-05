import { Uint64BE } from 'int64-buffer';
import { SmartContractBase } from '../base/smartConstractBase';

export class WhiteListPark extends SmartContractBase {
    static hash_ref = new Set<string>([
        '1220d9392e29049a8edf9a91ec9d8cc259f4b397467744500db75bba09774df469ab',
        '1220b4107c99897918a7a404d91733f5f8ec92032773b4f1e99e72ca31e724400f2f',
    ]);

    static getBalanceAsNumber(data:Uint8Array):Uint64BE {
        const dataObj = this.mpDencode(data) as {[key:string]:Uint64BE};
        if (data && dataObj) {
            // eslint-disable-next-line max-len
            return new Uint64BE(Object.values(dataObj).map((n) => { return n.toNumber(); }).reduce((acc, next) => { return acc + next; }, 0));
        }
        return new Uint64BE(0);
    }
}
