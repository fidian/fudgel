import { component } from '/fudgel.min.js';

component(
    'directive-property',
    {
        template: `
            <child-component
                .child-list="parentList"
            ></child-component>
        `,
    },
    class {
        parentList = ['Apple', 'Banana', 'Cherry'];
    }
);

component(
    'child-component',
    {
        prop: ['childList'],
        template: `
            <ul>
                <li *for="item of childList">{{item}}</li>
            </ul>
        `,
    },
    class {
        childList = [];
    }
);
