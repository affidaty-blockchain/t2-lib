/**
 * Returns the bitlength of a number
 *
 * @param a
 * @returns The bit length
 */
export function bitLength(a: number|bigint): number {
    let _a = typeof a === 'number' ? BigInt(a) : a;

    if (_a === BigInt(1)) return 1;
    let bits = 1;
    do {
        bits += 1;
        // eslint-disable-next-line no-bitwise, no-cond-assign
    } while ((_a >>= BigInt(1)) > BigInt(1));
    return bits;
}
