import { component } from 'fudgel';

export function defineMyElement(prefix = 'my-') {
    component(
        `${prefix}element`,
        {
            template: 'Hello, world!',
        },
        class {
            // Add your controller logic here
        }
    );
}
