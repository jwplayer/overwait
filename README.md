# Overwait
A lightweight library to supercharge the await operator!

## Description
Overwait takes your objects (and functions) and wraps them in a `Proxy` that automatically distributes the `await` operator down every step during property lookups, function return values, etc.

For example:
```js
import overwait from 'overwait';

// Wrap the fetch function to make it less tedious
const fetchy = overwait(fetch);
```

### What does that mean?
In practice, overwait transforms `await a.b.c` into `await (await (await a).b).c`.

<table>
  <caption>
    Overwait Usage Examples
  </caption>
  <tr>
    <th>Before...</th>
    <th><b>...with Overwait!</b></th>
  </tr>
  <tr>
    <td>

```js
const res = await fetch('https://x.com');
const body = await res.json();
```

   </td>
    <td>

```js
const body = await fetchy('https://x.com').json();
```

   </td>
  </tr>
  <tr>
    <td>

```js
// Not a specific db library, just an example
const conn = await db.conn('mydb');
const cursor = await conn.query('SELECT A');
const row = await cursor.getRow();
const value = await row.A;
```

   </td>
    <td>

```js
const value = await db.conn('mydb')
                      .query('SELECT A')
                      .getRow().A;
```

   </td>
  </tr>
  <tr>
    <td>

```js
const [fileHandle] = await showOpenFilePicker();
const file = await fileHandle.getFile();
```

   </td>
    <td>

```js
const file = await showOpenFilePicker()[0].getFile();
```

   </td>
  </tr>
</table>


## Other cool things!

When using `overwait` to traverse a property chain, we automatically wrap the `this` value in functions that are executed as a part of that traversal.

This fact allows you to write code like this:

```js
const getValueFooBar = async function() {
  // We don't need concern ourselves if
  // `this`, `foo`, or `bar` are some mix of promises:
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

### But, Jon, I don't want to use `await`!

No `await`? No problem!

Because `await` is just syntactic sugar for `then`, the way the library works actually allows you to `then` to your hearts content.

What this means is that to `overwait` this:

```js
await promise1.promise2.promise3;
/*...stuff what comes after...*/
```

Is identical to this:

```js
promise1.promise2.promise3.then(() => {
/*...stuff what comes after...*/
});
```

...and it just works!
