// Vanilla JavaScript using window.Fudgel
Fudgel.component(
    'my-custom-component',
    {
        template: `Hello {{audience}}`,
    },
    class {
        audience = 'world';
    }
);
