import Alea from 'alea';
import { modInv } from '../bigIntModArith/index';
import { IEllipticCurveParams } from './baseTypes';

function absMod(n: bigint, p: bigint) {
    return n < BigInt(0) ? (n % p) + p : n % p;
}

function pointAdd(px: bigint, py: bigint, qx: bigint, qy: bigint, p: bigint) {
    const num = qy - py;
    const denum = modInv((qx - px), p);
    const lambda = (num * denum) % p;
    const x = absMod(lambda ** BigInt(2) - px - qx, p);
    const y = absMod(lambda * (px - x) - py, p);
    return { x, y };
}

function pointDouble(px: bigint, py: bigint, a: bigint, p: bigint) {
    const num = BigInt(3) * px ** BigInt(2) + a;
    const denum = modInv((BigInt(2) * py), p);
    const lambda = (num * denum) % p;
    const x = absMod(lambda ** BigInt(2) - BigInt(2) * px, p);
    const y = absMod(lambda * (px - x) - py, p);
    return { x, y };
}

function pointMultiply(d: bigint, px: bigint, py:bigint, a:bigint, p:bigint) {
    const pAdd = (p1x: bigint, p1y: bigint, p2x: bigint, p2y: bigint) => {
        return pointAdd(p1x, p1y, p2x, p2y, p);
    };
    const pDouble = (x: bigint, y: bigint) => {
        return pointDouble(x, y, a, p);
    };
    const recursive = ({ x, y }: {x: bigint, y:bigint}, n: bigint): {x:bigint, y:bigint} => {
        if (n === BigInt(0)) {
            return { x: BigInt(0), y: BigInt(0) };
        }
        if (n === BigInt(1)) {
            return { x, y };
        }
        if (n % BigInt(2) === BigInt(1)) {
            const r = recursive({ x, y }, n - BigInt(1));
            return pAdd(x, y, r.x, r.y);
        }
        return recursive(pDouble(x, y), n / BigInt(2));
    };
    return recursive({ x: px, y: py }, d);
}

export function getSeededBytes(seed: any, byteLength: number): Uint8Array {
    const result = new Uint8Array(byteLength);
    const prnGen = Alea(seed);
    let pushedBytes = 0;
    while (pushedBytes < result.byteLength) {
        const prn = prnGen();
        const arr = new Uint8Array(new Float32Array([prn]).buffer).subarray(0, 3);
        let i = 0;
        while (i < 3) {
            if (pushedBytes >= result.byteLength) {
                break;
            }
            result[pushedBytes] = arr[i];
            pushedBytes += 1;
            i += 1;
        }
    }
    return result;
}

export function genSeededECKeys(
    curveParams: IEllipticCurveParams,
    seed: any,
): {x: bigint, y: bigint, d: bigint} {
    const byteLength = Math.floor(curveParams.keyLength / 8);
    let d: bigint = BigInt(0);
    let nextSeed = seed;
    let found = false;

    while (!found) {
        const bytes = getSeededBytes(nextSeed, byteLength);
        const number = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
        if (number >= BigInt(0) && number < curveParams.n) {
            found = true;
            d = number;
            break;
        }
        nextSeed = bytes;
    }

    const { x, y } = pointMultiply(
        d,
        curveParams.g.x,
        curveParams.g.y,
        curveParams.a,
        curveParams.p,
    );

    return { x, y, d };
}

export default genSeededECKeys;
