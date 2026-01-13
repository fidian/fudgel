import { component, di, diOverride } from '/fudgel.min.js';

class LogService {
    constructor(prefix) {
        this.prefix = prefix;
    }

    writeToConsole(message) {
        console.log(`${this.prefix}: ${message}`);
    }
}

diOverride(LogService, new LogService('MESSAGE:'));

component(
    'utility-di-override',
    {
        template: `
            <button @click="sendLog()">
                Log to Console
            </button>
        `,
    },
    class {
        logger = di(LogService);

        sendLog() {
            this.logger.writeToConsole('Logging a message');
        }
    }
);
