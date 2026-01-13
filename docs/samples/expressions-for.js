import { component } from '/fudgel.min.js';

component('expressions-for', {
    template: `
        <p>Controller Name: {{ name }}, color {{color}}</p>

        <ul>
            <li *for="name of childNames">
                Child Name: {{ name }}, color {{color}}
            </li>
        </ul>
    `,
}, class {
    childNames = [ 'child1', 'child2' ];
    name = 'component';
    color = 'yellow';
});
