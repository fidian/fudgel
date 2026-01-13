import { component } from '/fudgel.min.js';

component(
    'directive-for',
    {
        template: `
            <ul>
                <li *for="itemList">
                    [{{key}}]: {{value.name}} - {{value.desc}}
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
