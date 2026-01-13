import { component, defineRouterComponent } from '/fudgel.min.js';

defineRouterComponent('app-router');

component('routing-parameters', {
    template: `
        <app-router>
            <div path="/user/:userId"
                component="show-user"></div>
            <div>
                Show user:<br />
                <a href="/user/open-ai">OpenAI</a><br />
                <a href="/user/chat-gpt">ChatGPT</a>
            </div>
        </app-router>
    `,
});

component('show-user', {
    attr: ['userId'],
    template: `
        UserId: {{userId}}<br />
        <a href="/">Back to index</a>
    `,
});
