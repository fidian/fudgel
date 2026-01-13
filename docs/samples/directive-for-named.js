import { component } from '/fudgel.min.js';

component(
    'directive-for-named',
    {
        template: `
            <p>Using "key" and "value":</p>
            <ul>
                <li *for="itemList">
                    [{{key}}]: {{value.name}} - {{value.desc}}
                </li>
            </ul>
            <p>Renaming "value" to "item":</p>
            <ul>
                <li *for="item of itemList">
                    [{{key}}]: {{item.name}} - {{item.desc}}
                </li>
            </ul>
            <p>Naming the key as "index" and value as "item":</p>
            <ul>
                <li *for="index, item of itemList">
                    [{{index}}]: {{item.name}} - {{item.desc}}
                </li>
            </ul>
        `,
    },
    class {
        itemList = [
            { name: 'Item 1', desc: 'This is item 1' },
            { name: 'Item 2', desc: 'Another item here' },
        ];
    }
);
