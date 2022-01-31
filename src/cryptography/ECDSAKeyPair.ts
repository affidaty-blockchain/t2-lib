import { IKeyPairParams } from './baseTypes';
import { ECDSAP384R1KeyPairParams as defaultParams } from './cryptoDefaults';
import { BaseECKeyPair } from './baseECKeyPair';

/** A wrapper around BaseECKeyPair class which automatically uses default ECDSA params */
export class ECDSAKeyPair extends BaseECKeyPair {
    constructor(keyPairParams: IKeyPairParams = defaultParams) {
        super(keyPairParams);
    }
}
