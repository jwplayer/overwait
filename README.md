# Overwait
A lightweight helper to supercharge await!

## Description
### What does it do?
Overwait takes your objects and wraps them in a proxy that automatically distributes the `await` operator down every step during property lookups, function return values, etc.

### What does that mean?
In practice, overwait takes `await a.b.c` and turns it into `await (await (await a).b).c`. The simplest usecase is for `fetch`:

Old way:
```js
const res = await fetch('https://example.com');
const body = await res.json();
```

Overwait way:
```js
const body = await fetchEach('https://example.com').json();
```

But what is `fetchEasy`? Simple: it's just the fetch function wrapped in overwait: `const fetchEasy = overwait(fetch);`!

