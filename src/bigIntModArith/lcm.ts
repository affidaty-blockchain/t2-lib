import { abs } from './abs';
import { gcd } from './gcd';
/**
 * The least common multiple computed as abs(a*b)/gcd(a,b)
 * @param a
 * @param b
 *
 * @returns The least common multiple of a and b
 */
export function lcm(a: number|bigint, b: number|bigint): bigint {
    let _a = typeof a === 'number' ? BigInt(a) : a;
    let _b = typeof b === 'number' ? BigInt(b) : b;

    if (_a === BigInt(0) && _b === BigInt(0)) return BigInt(0);
    return abs((_a / gcd(_a, _b)) * _b) as bigint;
}
