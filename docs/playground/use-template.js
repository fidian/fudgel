import { component, css, di, emit, html } from './fudgel.js';
import { PlaygroundDataService } from '../playground-data-service.js';

const templates = {
    'basic.html': 'Basic Template',
    'count-characters.html': 'Count characters',
    'dependency-injection.html': 'Dependency injection',
    '../fudgel-sizes.js': 'Load JSON into Table',
    'simulated-typing.html': 'Simulated typing',
    'live-playground.js': 'This live playgroud!',
};

component(
    'use-template',
    {
        style: css`
            .wrapper {
                position: relative;
            }

            select {
                position: absolute;
                inset: 0;
                opacity: 0;
            }

            .hide {
                display: none;
            }
        `,
        template: html`
            <div class="wrapper">
                <button>Use Template</button>
                <select @change="useTemplate($event)">
                    <option value="" class="hide"></option>
                    <option *for="key, value of templates" value="{{key}}">{{value}}</option>
                </select>
            </div>
        `,
    },
    class {
        playgroundDataService = di(PlaygroundDataService);
        templates = templates;

        async useTemplate(event) {
            const target = event.target;
            const key = target.value;
            target.value = '';

            emit(this, 'contentChange', 'Loading template...');
            const response = await fetch(key);
            const content = await response.text();

            if (key.endsWith('.js')) {
                emit(this, 'contentChange', this.playgroundDataService.jsToPlayground(content));
            } else {
                emit(this, 'contentChange', content);
            }
        }
    }
);
