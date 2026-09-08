import { describe, expect, it, vi } from 'vitest';
import { di, diOverride } from '../../src/di.js';

describe('di', () => {
    it('returns one instance per class', () => {
        class Service {}
        expect(di(Service)).toBe(di(Service));
        expect(di(Service)).toBeInstanceOf(Service);
    });

    it('honors an override', () => {
        class Service {
            name = 'real';
        }
        const fake = { name: 'fake' } as Service;
        diOverride(Service, fake);
        expect(di(Service)).toBe(fake);
    });

    it('recovers after a constructor throws', () => {
        let attempts = 0;

        class Flaky {
            constructor() {
                if (attempts++ == 0) {
                    throw new Error('first time only');
                }
            }
        }

        expect(() => di(Flaky)).toThrow('first time only');
        // The failed attempt must not leave Flaky looking like a cycle.
        expect(di(Flaky)).toBeInstanceOf(Flaky);
        expect(attempts).toBe(2);
    });

    it('reports a genuine cycle and then keeps working', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});

        class Left {
            right = di(Right);
        }
        class Right {
            left = di(Left);
        }
        class Unrelated {}

        expect(() => di(Left)).toThrow('Circular dependency: Left -> Right -> Left');
        expect(di(Unrelated)).toBeInstanceOf(Unrelated);
        error.mockRestore();
    });
});
