import { arrayUnion } from '../utils';
import {
    IKeyParams,
    IKeyPairParams,
    TKeyUsages,
    TKeyGenAlgorithmValidHashValues,
    IEllipticCurveParams,
} from './baseTypes';

export const DEF_AES_IV_BYTE_LEN: number = 12;

export const DEF_AES_SALT_BYTE_LEN: number = 16;

export const DEF_SIGN_HASH_ALGORITHM: TKeyGenAlgorithmValidHashValues = 'SHA-384';

/** List of default params Ids */
export const EKeyParamsIds = {
    AESGCM256: 'aesgcm_256',
    HMACSHA384: 'hmac_sha384',
    ECDSAP384R1: 'ecdsa_secp384r1',
    ECDSAP256R1: 'ecdsa_secp256r1',
    ECDHP384R1: 'ecdh_secp384r1',
    RSAOAEP384: 'rsa_oaep_384',
    EMPTY: '',
};

/** Params set for an empty key */
export const EmptyKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.EMPTY,
    genAlgorithm: {
        name: '',
    },
    usages: [],
    type: 'undefined',
};

/** Params set for an empty key pair */
export const EmptyKeyPairParams: IKeyPairParams = {
    publicKey: EmptyKeyParams,
    privateKey: EmptyKeyParams,
    usages: [],
};

/** Params set for ECDSA P-384 public key */
export const ECDSAP384R1PubKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'ECDSA',
        namedCurve: 'P-384',
    },
    usages: ['verify'],
    type: 'public',
};

/** Params set for ECDSA P-384 private key */
export const ECDSAP384R1PrivKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'ECDSA',
        namedCurve: 'P-384',
    },
    usages: ['sign'],
    type: 'private',
};

/** Params set for ECDSA P-384 key pair */
export const ECDSAP384R1KeyPairParams: IKeyPairParams = {
    publicKey: ECDSAP384R1PubKeyParams,
    privateKey: ECDSAP384R1PrivKeyParams,
    get usages(): TKeyUsages {
        return arrayUnion([this.publicKey.usages!, this.privateKey.usages!]);
    },
};

/** Params set for ECDSA P-256 public key */
export const ECDSAP256R1PubKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP256R1,
    genAlgorithm: {
        name: 'ECDSA',
        namedCurve: 'P-256',
    },
    usages: ['verify'],
    type: 'public',
};

/** Params set for ECDSA P-256 private key */
export const ECDSAP256R1PrivKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP256R1,
    genAlgorithm: {
        name: 'ECDSA',
        namedCurve: 'P-256',
    },
    usages: ['sign'],
    type: 'private',
};

/** Params set for ECDSA P-256 key pair */
export const ECDSAP256R1KeyPairParams: IKeyPairParams = {
    publicKey: ECDSAP256R1PubKeyParams,
    privateKey: ECDSAP256R1PrivKeyParams,
    get usages(): TKeyUsages {
        return arrayUnion([this.publicKey.usages!, this.privateKey.usages!]);
    },
};

/** Params set for ECDH P-384 public key */
export const ECDHP384R1PubKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'ECDH',
        namedCurve: 'P-384',
    },
    usages: [],
    type: 'public',
};

/** Params set for ECDh P-384 private key */
export const ECDHP384R1PrivKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'ECDH',
        namedCurve: 'P-384',
    },
    usages: ['deriveKey', 'deriveBits'],
    type: 'private',
};

/** Params set for ECDH P-384 key pair */
export const ECDHP384R1KeyPairParams: IKeyPairParams = {
    publicKey: ECDHP384R1PubKeyParams,
    privateKey: ECDHP384R1PrivKeyParams,
    get usages(): TKeyUsages {
        return arrayUnion([this.publicKey.usages!, this.privateKey.usages!]);
    },
};

/** Params set for RSA-OAEP public key */
export const RSAOAEP384PubKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: 'SHA-384',
    },
    usages: ['encrypt', 'wrapKey'],
    type: 'public',
};

/** Params set for RSA-OAEP private key */
export const RSAOAEP384PrivKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: 'SHA-384',
    },
    usages: ['decrypt', 'unwrapKey'],
    type: 'private',
};

/** Params set for RSA-OAEP key pair */
export const RSAOAEP384KeyPairParams: IKeyPairParams = {
    publicKey: RSAOAEP384PubKeyParams,
    privateKey: RSAOAEP384PrivKeyParams,
    get usages(): TKeyUsages {
        return arrayUnion([this.publicKey.usages!, this.privateKey.usages!]);
    },
};

/** Params set for AES-GCM 256-bit long symmetric key */
export const AESGCM256KeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.AESGCM256,
    genAlgorithm: {
        name: 'AES-GCM',
        length: 256,
    },
    usages: ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
    type: 'secret',
};

/** Params set for HMAC symmetric key using SHA-384 hash algorithm */
export const HMACSHA384KeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.HMACSHA384,
    genAlgorithm: {
        name: 'HMAC',
        hash: 'SHA-384',
    },
    usages: ['sign', 'verify'],
    type: 'secret',
};

/** Mapping of params Ids with actual parameters */
export const mKeyPairParams: ReadonlyMap<string, IKeyPairParams> = new Map([
    [EKeyParamsIds.EMPTY, EmptyKeyPairParams],
    [EKeyParamsIds.ECDSAP384R1, ECDSAP384R1KeyPairParams],
    [EKeyParamsIds.ECDSAP256R1, ECDSAP256R1KeyPairParams],
    [EKeyParamsIds.ECDHP384R1, ECDHP384R1KeyPairParams],
    [EKeyParamsIds.RSAOAEP384, RSAOAEP384KeyPairParams],
]);

export const ellipticCurves: {[key: string]: IEllipticCurveParams} = {
    'P-256': {
        keyLength: 256,
        p: BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff'),
        a: BigInt('0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc'),
        b: BigInt('0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b'),
        g: {
            x: BigInt('0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296'),
            y: BigInt('0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5'),
        },
        n: BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'),
    },
    'P-384': {
        keyLength: 384,
        p: BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffff'),
        a: BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000fffffffc'),
        b: BigInt('0xb3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef'),
        g: {
            x: BigInt('0xaa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7'),
            y: BigInt('0x3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f'),
        },
        n: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973'),
    },
};
