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

### Is that it?

Well no because it's applying `await` to each level in an object, you can do some crazy things because you'll dig into multiple levels of asynchronous operations:

```js
// Not a specific db library, just an example
const dbAll = overwait(db);
const value = await dbAll.conn('localhost').query('SELECT aColumn FROM MyTable').getRow().aColumn;
```

Above is indentical to doing:
```js
const conn = await db.conn('localhost');
const cursor = await conn.query('SELECT aColumn FROM MyTable');
const row = await cursor.getRow();
const value = await row.aColumn;
```

## Other cool things!

When using `overwait` to traverse a property chain, we automatically wrap the `this` value in functions that are executed as a part of that traversal.

This fact allows you to write code like this:

```js
const getValueFooBar = async function() {
  // We don't need concern ourselves if `this`, `foo`, or `bar` are some mix of promises:
  return await this.foo.bar;
};
```

Then when using that function in an object, it just works:
```js
  const obj = overwait({
    foo: Promise.resolve({
      bar: Promise.resolve('hi there!')
    })
    value: getValueFooBar
  });

  await obj.value(); //=> 'hi there!';
```
