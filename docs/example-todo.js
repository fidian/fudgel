// This odd syntax is to allow more browsers to be able to use this
// file. It would be better to use "import" statements instead.
import('./fudgel.min.js').then(({ component, css, html, update }) => {
    const ADJECTIVES = [
        'pretty',
        'large',
        'big',
        'small',
        'tall',
        'short',
        'long',
        'handsome',
        'plain',
        'quaint',
        'clean',
        'elegant',
        'easy',
        'angry',
        'crazy',
        'helpful',
        'mushy',
        'odd',
        'unsightly',
        'adorable',
        'important',
        'inexpensive',
        'cheap',
        'expensive',
        'fancy',
    ];
    const COLOURS = [
        'red',
        'yellow',
        'blue',
        'green',
        'pink',
        'brown',
        'purple',
        'brown',
        'white',
        'black',
        'orange',
    ];
    const NOUNS = [
        'table',
        'chair',
        'house',
        'bbq',
        'desk',
        'car',
        'pony',
        'cookie',
        'sandwich',
        'burger',
        'pizza',
        'mouse',
        'keyboard',
    ];

    component(
        'example-todo',
        {
            style: css`
                :host {
                    display: block;
                    border: 1px solid #ccc;
                }

                .table-wrapper {
                    max-height: 50vh;
                    overflow-y: auto;
                }

                tr.selected {
                    background-color: yellow;
                }

                a {
                    color: blue;
                }

                a:hover {
                    text-decoration: underline;
                }
            `,
            template: html`
                <button @click="build1()">Create 1 row</button>
                <button @click="build10()">Create 10 rows</button>
                <button @click="build1k()">Create 1,000 rows</button>
                <button @click="build10k()">Create 10,000 rows</button>
                <button @click="append1k()">Append 1,000 rows</button>
                <button @click="update()">Update every 10th row</button>
                <button @click="clear()">Clear</button>
                <button @click="swapRows()">Swap Rows</button>
                <div class="table-wrapper">
                    <table>
                        <tr
                            *for="item of data"
                            class="{{rowClass(selected, item.id)}}"
                        >
                            <td>{{item.id}}</td>
                            <td>
                                <a @click.prevent="select(item.id)"
                                    >{{item.label}}</a
                                >
                            </td>
                            <td><a @click.prevent="delete(item.id)">❌</a></td>
                        </tr>
                    </table>
                </div>
            `,
        },
        class {
            constructor() {
                this.nextId = 1;
                this.data = [];
                this.selected = null;
            }

            append1k() {
                this.data = [...this.data, ...this.buildData(1000)];
                this.selected = null;
            }

            build1() {
                this.data = this.buildData(1);
                this.selected = null;
            }

            build10() {
                this.data = this.buildData(10);
                this.selected = null;
            }

            build1k() {
                this.data = this.buildData(1000);
                this.selected = null;
            }

            build10k() {
                this.data = this.buildData(10000);
                this.selected = null;
            }

            clear() {
                this.data = [];
                this.selected = null;
            }

            delete(id) {
                this.data = this.data.filter(d => d.id !== id);
                this.selected = null;
            }

            rowClass(selected, id) {
                return selected === id ? 'selected' : '';
            }

            select(id) {
                this.selected = id;
                update(this); // force update of bound events
            }

            swapRows() {
                if (this.data.length > 998) {
                    const a = this.data[1];
                    this.data[1] = this.data[998];
                    this.data[998] = a;
                }
            }

            update() {
                for (const item of this.data) {
                    item.label += ' !!!';
                }

                this.selected = null;
            }

            buildData(count) {
                const data = [];

                for (let i = 0; i < count; i++) {
                    data.push({
                        id: this.nextId++,
                        label: `${ADJECTIVES[this.random(ADJECTIVES.length)]} ${
                            COLOURS[this.random(COLOURS.length)]
                        } ${NOUNS[this.random(NOUNS.length)]}`,
                    });
                }

                return data;
            }

            random(max) {
                return Math.round(Math.random() * 1000) % max;
            }
        }
    );
});
