import { component } from '/fudgel.min.js';

component(
    'test-events',
    {
        template: `
            <div
                @click.stop.prevent.outside="click('outside')"
                @click.stop.prevent="click('inside')"
                style="border: 1px solid black; padding: 10px; display: inline-block;"
                >
                Click inside or outside this box
            </div>
            <div>{{clickMessage}}</div>
        `,
    },
    class {
        clickMessage = 'Ready for your next click';
        timeout = null;
        click(message) {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.clickMessage = `You clicked ${message} the box!`;
            this.timeout = setTimeout(() => {
                this.clickMessage = 'Ready for your next click';
                this.timeout = null;
            }, 2000);
        }
    }
);
