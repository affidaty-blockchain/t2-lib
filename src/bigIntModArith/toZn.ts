/**
 * Finds the smallest positive element that is congruent to a in modulo n
 *
 * @remarks
 * a and b must be the same type, either number or bigint
 *
 * @param a - An integer
 * @param n - The modulo
 *
 * @throws {@link RangeError} if n <= 0
 *
 * @returns A bigint with the smallest positive representation of a modulo n
 */
export function toZn(a: number|bigint, n: number|bigint): bigint {
    let _a = typeof a === 'number' ? BigInt(a) : a;
    let _n = typeof n === 'number' ? BigInt(n) : n;

    if (_n <= BigInt(0)) {
        throw new RangeError('n must be > 0');
    }

    const aZn = _a % _n;
    return (aZn < BigInt(0)) ? aZn + _n : aZn;
}
