(() => {
    setTimeout(() => {
        // List higher ancestory tags first to ensure proper removal
        const tagNames = [
            'test-grandparent',
            'test-parent',
            'test-parent-slot',
            'test-parent-slot-like',
            'test-child-slot',
        ];

        for (const tagName of tagNames) {
            for (const element of document.getElementsByTagName(tagName)) {
                element.remove();
            }
        }
    }, 100);
})();
