export interface Egcd {
    g: bigint
    x: bigint
    y: bigint
}
/**
 * An iterative implementation of the extended euclidean algorithm or extended greatest common
 * divisor algorithm. Take positive integers a, b as input, and return a triple (g, x, y),
 * such that ax + by = g = gcd(a, b).
 *
 * @param a
 * @param b
 *
 * @throws {@link RangeError} if a or b are <= 0
 *
 * @returns A triple (g, x, y), such that ax + by = g = gcd(a, b).
 */
export function eGcd(a: number|bigint, b: number|bigint): Egcd {
    let _a = typeof a === 'number' ? BigInt(a) : a;
    let _b = typeof b === 'number' ? BigInt(b) : b;

    if (_a <= BigInt(0) || _b <= BigInt(0)) throw new RangeError('a and b MUST be > 0'); // a and b MUST be positive

    let x = BigInt(0);
    let y = BigInt(1);
    let u = BigInt(1);
    let v = BigInt(0);

    while (_a !== BigInt(0)) {
        const q = _b / _a;
        const r = _b % _a;
        const m = x - (u * q);
        const n = y - (v * q);
        _b = _a;
        _a = r;
        x = u;
        y = v;
        u = m;
        v = n;
    }
    return {
        g: _b,
        x,
        y,
    };
}
