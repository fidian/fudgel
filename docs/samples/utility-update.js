import { component, update } from './fudgel.min.js';

component(
    'utility-update',
    {
        template: `
            <p>Name: {{user.name}}</p>
            <button @click="clicked()">Update</button>
        `,
    },
    class {
        onInit() {
            // Set up a deeply nested object
            this.user = {
                name: 'Test User',
            };
        }

        clicked() {
            // Update the deeply nested object
            this.user.name = 'Updated';

            // Force an update
            update(this);
        }
    }
);
