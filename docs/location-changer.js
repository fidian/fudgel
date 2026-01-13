import { component, defineRouterComponent } from '/fudgel.min.js';

defineRouterComponent('app-router');

window.addEventListener('load', () => {
    const div = document.createElement('div');
    div.innerHTML = `Location: <input id="loc" type="text" value="/type-here">
        (this updates the route <i>LIVE</i>)
        <hr>`;
    document.body.insertBefore(div, document.body.firstChild);
    const loc = document.getElementById('loc');
    loc.addEventListener('keyup', () => {
        history.pushState(null, '', loc.value);
    });
});

component('app-login', {
    template: 'Custom app-login web component',
});
component('store-list', {
    template: 'Custom store-list web component',
});
