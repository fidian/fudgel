import { describe, expect, it } from 'vitest';
import { entries, isFunction } from '../../src/util.js';

describe('entries', () => {
    it('iterates a Map in insertion order', () => {
        expect([...entries(new Map([['b', 1], ['a', 2]]))]).toEqual([['b', 1], ['a', 2]]);
    });

    it('iterates a Set as value pairs', () => {
        expect([...entries(new Set(['x', 'y']))]).toEqual([['x', 'x'], ['y', 'y']]);
    });

    it('iterates an array with index keys', () => {
        expect([...entries(['a', 'b'])]).toEqual([[0, 'a'], [1, 'b']]);
    });

    it('iterates a plain object', () => {
        expect([...entries({ a: 1, b: 2 })]).toEqual([['a', 1], ['b', 2]]);
    });

    it('is not fooled by a property named entries', () => {
        // A plain object may have any key, including the name of the Map
        // method this helper reaches for first.
        expect([...entries({ entries: 1, other: 2 })]).toEqual([['entries', 1], ['other', 2]]);
        expect([...entries({ entries: 'a string' })]).toEqual([['entries', 'a string']]);
    });

    it('iterates any other iterable by index', () => {
        function* letters() {
            yield 'p';
            yield 'q';
        }
        expect([...entries(letters())]).toEqual([[0, 'p'], [1, 'q']]);
    });
});

describe('isFunction', () => {
    it('answers for functions and nothing else', () => {
        expect(isFunction(() => {})).toBe(true);
        expect(isFunction(class {})).toBe(true);
        expect(isFunction(Math.max)).toBe(true);
        expect(isFunction(1)).toBe(false);
        expect(isFunction('f')).toBe(false);
        expect(isFunction(null)).toBe(false);
        expect(isFunction(undefined)).toBe(false);
        expect(isFunction({ call() {} })).toBe(false);
    });
});
