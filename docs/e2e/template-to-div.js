(() => {
    for (const template of document.getElementsByTagName('template')) {
        const div = document.createElement('div');
        div.innerHTML = template.innerHTML;
        template.replaceWith(div);
    }
})();
