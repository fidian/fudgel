import { component } from '/fudgel.min.js';

component(
    'expressions-bindings',
    {
        template: `
            <p><button @click="updateProperty()">Update property</button>
            Updating the property directly will not trigger an update.</p>
            <p><button @click="updateObject()">Update object</button>
            Updating the object reference will trigger an update.</p>
            <p>Number: {{ obj.number }}</p>
        `,
    },
    class {
        obj = { number: 0 };
        updateProperty() {
            this.obj.number += 1;
        }
        updateObject() {
            this.obj = { number: this.obj.number + 1 };
        }
    }
);
