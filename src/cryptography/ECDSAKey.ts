import { IKeyParams } from './baseTypes';
import { ECDSAP384R1KeyPairParams as defaultParams } from './cryptoDefaults';
import { BaseECKey } from './baseECKey';

type TKeyType = 'public' | 'private';

/** A wrapper around BaseECKey class which automatically uses default ECDSA params */
export class ECDSAKey extends BaseECKey {
    constructor(keyType: TKeyType, keyParams?: IKeyParams) {
        super();
        switch (keyType) {
            case 'public':
                this.keyParams = typeof keyParams === 'undefined' ? defaultParams.publicKey : keyParams;
                this.type = 'public';
                break;
            default:
                this.keyParams = typeof keyParams === 'undefined' ? defaultParams.privateKey : keyParams;
                this.type = 'private';
                break;
        }
    }
}
