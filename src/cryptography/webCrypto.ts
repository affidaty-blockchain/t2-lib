import { NOT_SECURE_CONTEXT } from '../errors';
import { IS_BROWSER, IS_SECURE_CONTEXT } from '../browser';

declare const window: any;

if (IS_BROWSER && !IS_SECURE_CONTEXT) {
    throw Error(NOT_SECURE_CONTEXT);
}

/** Cryptographic object implementing Web Crypto API interface */
const WebCrypto = IS_BROWSER ? window.crypto || window.msCrypto : require('crypto').webcrypto;

const Subtle = WebCrypto.subtle;

export { WebCrypto, Subtle };
