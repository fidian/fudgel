import { describe, beforeEach, expect, it } from 'vitest';
import { component, html, metadata } from '../../src/fudgel.js';
import { $, mount } from '../support/dom.js';

component(
    'key-host',
    {
        template: html`<input
            id="in"
            @keydown.arrow-left="hit('arrow-left')"
            @keydown.enter="hit('enter')"
            @keydown.escape="hit('escape')"
            @keydown.code-32="hit('code-32')"
            @keydown.space="hit('space')"
            @keydown.ctrl.exact="hit('ctrl-exact')"
            @keydown.a="hit('a')"
        />`,
    },
    class {
        hits: string[] = [];

        hit(name: string) {
            this.hits.push(name);
        }
    }
);

const press = (key: string, init: KeyboardEventInit = {}) =>
    $('#in')!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
const hits = () => $('key-host')![metadata].hits as string[];

describe('key modifiers', () => {
    beforeEach(() => mount('<key-host></key-host>'));

    it('match dashed key names like arrow-left', () => {
        press('ArrowLeft');
        expect(hits()).toEqual(['arrow-left']);
    });

    it('match single-word key names', () => {
        press('Enter');
        press('Escape');
        expect(hits()).toEqual(['enter', 'escape']);
    });

    it('match a code point, and space by name', () => {
        press(' ');
        expect(hits()).toEqual(['code-32', 'space']);
    });

    it('match exact with only the named modifier held', () => {
        press('x', { ctrlKey: true });
        press('x', { ctrlKey: true, shiftKey: true });
        expect(hits()).toEqual(['ctrl-exact']);
    });

    it('match a letter in either case', () => {
        press('a');
        press('A');
        expect(hits()).toEqual(['a', 'a']);
    });
});
