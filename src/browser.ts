const os = require('os');

/** will be true if lib is executed in a browser */
export const IS_BROWSER = os.platform() === 'browser';

/** False if lib is executed outside a secure context.
 * Crypto and SubtleCrypto api, on which this lib relies,
 * won't be available outside a secure context.
 * Browser running an SSL/TSL connection or a NodeJS env
 * are considered secure contexts.
 */
export const IS_SECURE_CONTEXT = IS_BROWSER ? window.isSecureContext : true;
