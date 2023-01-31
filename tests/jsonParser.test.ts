import t2lib from '../index';
import {Int64BE, Uint64BE} from 'int64-buffer'

describe('parse', () => {
    it('standart json parse', async () => {
        const jsonString = '{"bool": true, "num": 42, "null": null, "string": "testString", "arr": [true, 42, null, "testString"], "obj": {"bool": false, "num": 42, "string": "testString"}}';
        const parsedResult = t2lib.jsonParse(jsonString);

        expect(typeof parsedResult.bool).toEqual('boolean');
        expect(parsedResult.bool).toBeTruthy();
        expect(typeof parsedResult.num).toEqual('number');
        expect(parsedResult.num).toEqual(42);
        expect(parsedResult.null === null).toBeTruthy();
        expect(typeof parsedResult.string).toEqual('string');
        expect(parsedResult.string).toEqual('testString');
        expect(Array.isArray(parsedResult.arr)).toBeTruthy();
        expect(parsedResult.arr).toEqual([true, 42, null, 'testString']);
        expect(typeof parsedResult.obj).toEqual('object');
        expect(parsedResult.obj).toEqual({ bool: false, num: 42, string: 'testString' });
    });

    it('custom parsers', async () => {
        const jsonString = '{"binUTF8": "$:bin:utf8:hello", "binHex": "$:bin:hex:00ff00ff", "binB58": "$:bin:b58:3xeAA", "binB64": "$:bin:b64:Av8A/w==", "i64Hex": "$:i64:hex:7FFFFFFFFFFFFFFF", "i64Dec": "$:i64:dec:9223372036854775807", "i64DecNeg": "$:i64:dec:-1", "u64Hex": "$:u64:hex:FFFFFFFFFFFFFFFF", "u64Dec": "$:u64:dec:18446744073709551615"}';
        const parsedResult: {
            binUTF8: Buffer,
            binHex: Buffer,
            binB58: Buffer,
            binB64: Buffer,
            i64Hex: Int64BE,
            i64Dec: Int64BE,
            i64DecNeg: Int64BE,
            u64Hex: Uint64BE,
            u64Dec: Uint64BE,
        } = t2lib.jsonParse(jsonString);

        // bin
        expect(Buffer.isBuffer(parsedResult.binUTF8)).toBeTruthy();
        expect(parsedResult.binUTF8.toString('hex')).toEqual('68656c6c6f');
        expect(Buffer.isBuffer(parsedResult.binHex)).toBeTruthy();
        expect(parsedResult.binHex.toString('hex')).toEqual('00ff00ff');
        expect(Buffer.isBuffer(parsedResult.binB58)).toBeTruthy();
        expect(parsedResult.binB58.toString('hex')).toEqual('01ff00ff');
        expect(Buffer.isBuffer(parsedResult.binB64)).toBeTruthy();
        expect(parsedResult.binB64.toString('hex')).toEqual('02ff00ff');

        // 64-bit numbers
        expect(parsedResult.i64Hex.toBuffer().toString('hex')).toEqual('7fffffffffffffff');
        expect(parsedResult.i64Dec.toBuffer().toString('hex')).toEqual('7fffffffffffffff');
        expect(parsedResult.i64DecNeg.toBuffer().toString('hex')).toEqual('ffffffffffffffff');
        expect(parsedResult.u64Hex.toBuffer().toString('hex')).toEqual('ffffffffffffffff');
        expect(parsedResult.u64Dec.toBuffer().toString('hex')).toEqual('ffffffffffffffff');
    });

    it('msgpack processor', async () => {
        const jsonString = '{"$:msgpack:msgpackTest": {"num": 42, "string": "testString", "binHex": "$:bin:hex:00ff00ff"}}';
        const parsedResult = t2lib.jsonParse(jsonString);

        expect(Buffer.isBuffer(parsedResult.msgpackTest)).toBeTruthy();
        expect(parsedResult.msgpackTest.toString('hex')).toEqual('83a36e756d2aa6737472696e67aa74657374537472696e67a662696e486578c40400ff00ff');

        const decodedInternal = t2lib.Utils.bytesToObject(new Uint8Array(parsedResult.msgpackTest));

        expect(typeof decodedInternal.num).toEqual('number');
        expect(decodedInternal.num).toEqual(42);
        expect(typeof decodedInternal.string).toEqual('string');
        expect(decodedInternal.string).toEqual('testString');
        expect(Buffer.isBuffer(decodedInternal.binHex)).toBeTruthy();
        expect(decodedInternal.binHex.toString('hex')).toEqual('00ff00ff');
    });
});
