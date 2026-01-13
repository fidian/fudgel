import { component } from '/fudgel.min.js';

component(
    'test-keyboard-events',
    {
        template: `
            <button
                @click.stop.prevent="changeClicks()"
                @click.ctrl="changeControlClicks()"
                @click.shift.exact="changeShiftClicksExact()"
                >
                Click me!
            </button>
            <div>Number of clicks: {{clicks}}</div>
            <div>Number of control-clicks: {{controlClicks}}</div>
            <div>Number of shift-clicks with exact: {{shiftClicksExact}}</div>
        `,
    },
    class {
        clicks = 0;
        controlClicks = 0;
        shiftClicksExact = 0;
        changeClicks() {
            this.clicks += 1;
        }
        changeControlClicks() {
            this.controlClicks += 1;
        }
        changeShiftClicksExact() {
            this.shiftClicksExact += 1;
        }
    }
);
