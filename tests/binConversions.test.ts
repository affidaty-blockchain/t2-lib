import * as t2lib from '../index';

describe('Testing conversions', () => {
    const testArrayBuffer = new ArrayBuffer(2);
    const testArrayBufferView = new Uint8Array(testArrayBuffer);
    testArrayBufferView[0] = 0xf9;
    testArrayBufferView[1] = 0xa7;
    const testBuffer = Buffer.from([0xf9, 0xa7]);
    const testB64 = '+ac=';
    const testB64url = '-ac';
    const testB58 = 'Kzv';
    it('Buffer<->ArrayBuffer', () => {
        expect(t2lib.binConversions.bufferToArrayBuffer(testBuffer))
            .toEqual(testArrayBuffer);
        expect(t2lib.binConversions.arrayBufferToBuffer(testBuffer))
            .toEqual(testBuffer);
    });
    it('Buffer<->Base64', () => {
        expect(t2lib.binConversions.bufferToBase64(testBuffer)).toEqual(testB64);
        expect(t2lib.binConversions.base64ToBuffer(testB64)).toEqual(testBuffer);
    });
    it('Buffer<->Base64url', () => {
        expect(t2lib.binConversions.bufferToBase64url(testBuffer)).toEqual(testB64url);
        expect(t2lib.binConversions.base64urlToBuffer(testB64url)).toEqual(testBuffer);
    });
    it('Buffer<->Base58', () => {
        expect(t2lib.binConversions.bufferToBase58(testBuffer)).toEqual(testB58);
        expect(t2lib.binConversions.base58ToBuffer(testB58)).toEqual(testBuffer);
    });
    it('ArrayBuffer<->Base64', () => {
        expect(t2lib.binConversions.arrayBufferToBase64(testArrayBuffer)).toEqual(testB64);
        expect(t2lib.binConversions.base64ToArrayBuffer(testB64)).toEqual(testArrayBuffer);
    });
    it('ArrayBuffer<->Base64url', () => {
        expect(t2lib.binConversions.arrayBufferToBase64url(testArrayBuffer)).toEqual(testB64url);
        expect(t2lib.binConversions.base64urlToArrayBuffer(testB64url)).toEqual(testArrayBuffer);
    });
    it('ArrayBuffer<->Base58', () => {
        expect(t2lib.binConversions.arrayBufferToBase58(testArrayBuffer)).toEqual(testB58);
        expect(t2lib.binConversions.base58ToArrayBuffer(testB58)).toEqual(testArrayBuffer);
    });
});
