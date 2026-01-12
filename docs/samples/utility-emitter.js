import { component, Emitter } from './fudgel.min.js';

class MyService {
    emitter = new Emitter();

    constructor() {
        setInterval(() => this.emitter.emit('tick'), 1000);
    }

    onTick(callback) {
        return this.emitter.on('tick', callback);
    }

    offTick(callback) {
        return this.emitter.off('tick', callback);
    }
}

const myService = new MyService();

component(
    'utility-emitter',
    {
        template: `
            <button
                *if="!tracking"
                @click="toggleTracking()"
            >Watch Ticks</button>
            <button
                *if="tracking"
                @click="toggleTracking()"
            >Stop Watching</button>
            <div>Tick count: {{tickCount}}</div>
        `,
    },
    class {
        tracking = false;
        tickCount = 0;
        tickTracker = () => (this.tickCount += 1);

        onDestroy() {
            myService.offTick(this.tickTracker);
        }

        toggleTracking() {
            this.tracking = !this.tracking;

            if (this.tracking) {
                myService.onTick(this.tickTracker);
            } else {
                myService.offTick(this.tickTracker);
            }
        }
    }
);
