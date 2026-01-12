import { component } from 'fudgel';

export function defineMyElement(prefix = 'my-') {
    component(
        `${prefix}export-component-function`,
        {
            template: 'Hello, world!',
        },
        class {
            // Add your controller logic here
        }
    );
}
