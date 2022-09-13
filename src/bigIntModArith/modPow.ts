import { abs } from './abs';
import { modInv } from './modInv';
import { toZn } from './toZn';
/**
 * Modular exponentiation b**e mod n. Currently using the right-to-left binary method
 *
 * @param b base
 * @param e exponent
 * @param n modulo
 *
 * @throws {@link RangeError} if n <= 0
 *
 * @returns b**e mod n
 */
export function modPow(b: number|bigint, e: number|bigint, n: number|bigint): bigint {
    let _b = typeof b === 'number' ? BigInt(b) : b;
    let _e = typeof e === 'number' ? BigInt(e) : e;
    const _n = typeof n === 'number' ? BigInt(n) : n;

    if (_n <= BigInt(0)) {
        throw new RangeError('n must be > 0');
    } else if (n === BigInt(1)) {
        return BigInt(0);
    }

    _b = toZn(_b, _n);

    if (_e < BigInt(0)) {
        return modInv(modPow(_b, abs(_e), _n), _n);
    }

    let r = BigInt(1);
    while (_e > 0) {
        if ((_e % BigInt(2)) === BigInt(1)) {
            r = (r * _b) % _n;
        }
        _e /= BigInt(2);
        _b = (_b ** BigInt(2)) % _n;
    }
    return r;
}
