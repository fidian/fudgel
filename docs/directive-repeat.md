---
title: *repeat Directive (Fudgel.js)
---

# `*repeat` Directive

Repeating a chunk of HTML a number of times is very easy when you add the `*repeat` [directive](directives.html) to your template. Use a fixed number or an [expression](expressions.html) to find the number.

<code-sample sample="samples/directive-repeat.js"></code-sample>

If you need to know what index you are on, you can use a special syntax of `*repeat="expression as indexName"`, where `indexName` is the name of the variable that will hold the current index.

<code-sample sample="samples/directive-repeat-named.js"></code-sample>
