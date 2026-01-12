import { component, di } from './fudgel.min.js';

class LogService {
    writeToConsole(message) {
        console.log(message);
    }
}

component(
    'utility-di',
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
