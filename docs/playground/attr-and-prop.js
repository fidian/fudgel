import { component } from './fudgel.min.js';

component(
    'prop-and-attr',
    {
        attr: ['myAttr'],
        prop: ['myProp'],
        template: `
                            <div><b>prop</b>: {{myProp}}</div>
                            <div><b>attr</b>: {{myAttr}}</div>
                        `,
    },
    class {
        constructor() {
            this.myAttr = 'Initial value is wiped by the attribute';
            this.myProp = 'This has not yet been assigned';
        }
    }
);

setTimeout(() => {
    document.querySelector('prop-and-attr').myProp =
        'This came from a property assignment';
}, 1000);
