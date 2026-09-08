// *for keys array items by index, so a reordered array used to rebuild
// every row that moved and a form control's typed value stayed at its old
// position. A track clause keys rows by identity instead.
import { describe, expect, it } from 'vitest';
import { component, html, metadata } from '../../src/fudgel.js';
import { $, $$, click, expectCount, expectValue, mount } from '../support/dom.js';

const rowsTemplate = (track: string) => html`
    <div *for="row of rows${track}" class="row">
        <input .value="row.name" />
        <span>{{row.name}}</span>
    </div>
    <button id="reverse" @click="reverse()">reverse</button>
    <button id="prepend" @click="prepend()">prepend</button>
    <button id="drop" @click="drop()">drop</button>
`;

class Rows {
    rows = [
        { id: 1, name: 'one' },
        { id: 2, name: 'two' },
        { id: 3, name: 'three' },
    ];

    reverse() {
        this.rows = [...this.rows].reverse();
    }

    prepend() {
        this.rows = [{ id: 0, name: 'zero' }, ...this.rows];
    }

    drop() {
        this.rows = this.rows.filter(row => row.id != 2);
    }
}

component('tracked-rows', { template: rowsTemplate(' track row.id') }, Rows);
component('positional-rows', { template: rowsTemplate('') }, Rows);

const names = () => $$('.row span').map(s => s.textContent).join('|');
const inputOf = (row: Element) => $<HTMLInputElement>('input', row)!;

describe('*for with track', () => {
    it('moves a row with its record and keeps the row\'s own state', async () => {
        await mount('<tracked-rows></tracked-rows>');
        await expectCount('.row', 3);
        const first = $$('.row')[0];
        inputOf(first).value = 'typed into one';

        await click('#reverse');
        await expectValue(names, 'three|two|one');
        expect($$('.row')[2]).toBe(first);
        expect(inputOf($$('.row')[2]).value).toBe('typed into one');
    });

    it('keeps existing rows when one is added in front or removed', async () => {
        await mount('<tracked-rows></tracked-rows>');
        await expectCount('.row', 3);
        const [one, two, three] = $$('.row');

        await click('#prepend');
        await expectValue(names, 'zero|one|two|three');
        expect($$('.row').slice(1)).toEqual([one, two, three]);

        await click('#drop');
        await expectValue(names, 'zero|one|three');
        expect($$('.row').slice(1)).toEqual([one, three]);
    });

    it('is not required: rows are still reused by position without it', async () => {
        await mount('<positional-rows></positional-rows>');
        await expectCount('.row', 3);
        const first = $$('.row')[0];

        await click('#reverse');
        await expectValue(names, 'three|two|one');
        expect($$('.row')[0]).toBe(first);
    });

    it('evaluates the track expression with the loop variables in scope', async () => {
        await mount('<tracked-rows></tracked-rows>');
        await expectCount('.row', 3);
        // Same ids, new objects: nothing is rebuilt, the values update.
        const controller = $('tracked-rows')![metadata];
        const before = $$('.row');
        controller.rows = controller.rows.map((row: any) => ({ ...row, name: row.name.toUpperCase() }));
        await expectValue(names, 'ONE|TWO|THREE');
        expect($$('.row')).toEqual(before);
    });
});
