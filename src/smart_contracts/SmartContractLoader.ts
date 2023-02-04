/* eslint-disable max-len */
import { AdvancedAsset } from './classes/AdvancedAsset';

import { SmartContractBase } from './base/smartConstractBase';
import { Eurs } from './classes/Eurs';
import { NFT } from './classes/NFT';
import { WhiteListPark } from './classes/WhiteListPark';
import { OrderBook } from './classes/OrderBook';
import { SynkRoulette } from './classes/SynkRoulette';
import { Withdraw } from './classes/Withdraw';

export class SmartContractLoader {
    static INIT() {
        this.setContract(AdvancedAsset);
        this.setContract(Eurs);
        this.setContract(NFT);
        this.setContract(WhiteListPark);
        this.setContract(OrderBook);
        this.setContract(SynkRoulette);
        this.setContract(Withdraw);
    }

    static setContract(newContractClass: typeof SmartContractBase, hash?: string) {
        if (hash) newContractClass.hash_ref.add(hash);
        newContractClass.hash_ref.forEach((h) => { return SmartContractBase.SC_CACHE.set(h, newContractClass); });
    }
}

/*
SC_EURS=12203c5f2f17bbfd5f7a96f401fa08b5075d78b620093cad9c2222354f11aeb11c4b
SC_ADVANCED_ASSET=1220f24353dad66c0aea2894956d6d8be2e209d87d7f3c1ff85b92e4bd611087d032
SC_ADVANCED_ASSET_1=1220f24353dad66c0aea2894956d6d8be2e209d87d7f3c1ff85b92e4bd611087d032
SC_NFT=1220a0ef0c54998d64d8d8dedf8e5c7f076b45b92da092fdd51d54be35abbfdb7de2
SC_WITHDRAW=122027add1445b855de99a8ad07f6d986dcce6a891cea06a6beeaa5ca190ca16737a
SC_PARK=1220d9392e29049a8edf9a91ec9d8cc259f4b397467744500db75bba09774df469ab
SC_PARK_2=1220b4107c99897918a7a404d91733f5f8ec92032773b4f1e99e72ca31e724400f2f
SC_TRINCI=1220587c85c62ed75998d520c5046724e3271690ce82e8cd3a7dac35cf14729765a6
SC_ORDERBOOK=1220af27bdaafcd0ffec8b3bf869b04b831888eec992b5f110840d11349135fee6f9
SC_SYNKROULETTE=122089eb757992edfa11ca7c5fb6269a5ecebe3eb17f6fece25dca537252209db233

*/
