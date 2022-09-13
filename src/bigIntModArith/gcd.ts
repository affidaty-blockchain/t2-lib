/* eslint-disable no-bitwise */
import { abs } from './abs';
/**
 * Greatest common divisor of two integers based on the iterative binary algorithm.
 *
 * @param a
 * @param b
 *
 * @returns The greatest common divisor of a and b
 */
export function gcd(a: number|bigint, b: number|bigint): bigint {
    let aAbs = (typeof a === 'number') ? BigInt(abs(a)) : abs(a) as bigint;
    let bAbs = (typeof b === 'number') ? BigInt(abs(b)) : abs(b) as bigint;

    if (aAbs === BigInt(0)) {
        return bAbs;
    }
    if (bAbs === BigInt(0)) {
        return aAbs;
    }

    let shift = BigInt(0);
    while (((aAbs | bAbs) & BigInt(1)) === BigInt(0)) {
        aAbs >>= BigInt(1);
        bAbs >>= BigInt(1);
        shift += BigInt(1);
    }
    while ((aAbs & BigInt(1)) === BigInt(0)) aAbs >>= BigInt(1);
    do {
        while ((bAbs & BigInt(1)) === BigInt(0)) bAbs >>= BigInt(1);
        if (aAbs > bAbs) {
            const x = aAbs;
            aAbs = bAbs;
            bAbs = x;
        }
        bAbs -= aAbs;
    } while (bAbs !== BigInt(0));

    // rescale
    return aAbs << shift;
}
