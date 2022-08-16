/** will be true if lib is executed in a browser */
let isBrowser = true;

try {
    /* eslint-disable-next-line global-require */
    const os = require('os');
    isBrowser = ((!os) || (os.platform() === 'browser'));
} catch (error) {
    // DO NOTHING
}

export const IS_BROWSER = isBrowser;

/** False if lib is executed outside a secure context.
 * Crypto and SubtleCrypto api, on which this lib relies,
 * won't be available outside a secure context.
 * Browser running an SSL/TSL connection or a NodeJS env
 * are considered secure contexts.
 */
export const IS_SECURE_CONTEXT = IS_BROWSER ? window.isSecureContext : true;
