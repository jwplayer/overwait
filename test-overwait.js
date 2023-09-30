import t from 'tap';
import overwait from './overwait.js';
import global from 'global';

const testObjBase = Promise.resolve({
  // Non-promise property
  string: 'string',

  pDate: new Date(),

  // Promise that resolves to an object
  pString: Promise.resolve('pString'),

  pObject: Promise.resolve({
    string: 'string',
    pNumber: Promise.resolve(42)
  }),

  // Promise that resolves to a function
  pFunction: Promise.resolve(async function (arg) {
    return Promise.resolve({
      string: 'string',
      //LOOK! We are even doing await-all in the `this` value of this function!
      pNumber: Promise.resolve((await this.pObject.pNumber) + arg)
    });
  }),

  pThrows: Promise.resolve(async function (arg) {
    throw new Error('Intentional Throw!');
  })
});

const testObj = overwait(testObjBase);

t.test('non-promise properties resolve', async (t) => {
  t.equal(await testObj.string, 'string');
});

t.test('promise properties resolve', async (t) => {
  t.equal(await testObj.pString, 'pString');
});

t.test('mixed properties deeply-resolve', async (t) => {
  t.equal(await testObj.pObject.string, 'string');
});

t.test('promise properties deeply-resolve', async (t) => {
  t.equal(await testObj.pObject.pNumber, 42);
});

t.test('promise functions deeply-resolve', async (t) => {
  t.equal(await testObj.pFunction(624).pNumber, 666);
});

t.test('mixed functions deeply-resolve', async (t) => {
  t.equal(await testObj.pFunction(624).string, 'string');
});

t.test('promise properties deep-resolve (with a naked then)', async (t) => {
  t.equal(await testObj.pObject.pNumber.then(), 42);
});

t.test('promise functions use the correct context (obj)', async (t) => {
  t.plan(1);
  const fn = async function(){
    t.equal(await this.foo, 'foo');
  };
  const obj = overwait({
    fn,
    foo: 'foo'
  });
  await obj.fn();
});


t.test('native-objects shouldn\'t have their context wrapped ', async (t) => {
  t.plan(1);
  t.equal(await testObj.pDate.toLocaleString(), (await testObjBase).pDate.toLocaleString());
})

t.test('functions use the correct context (global)', async (t) => {
  t.plan(1);
  const fn = overwait(async function() {
    t.equal(this, global);
  });
  await fn();
});

t.test('promise functions throw (handled)', async (t) => {
  try {
    await testObj.pThrows();
  } catch(err) {
    t.equal(err.message, 'Intentional Throw!');
  }
});

t.test('promise functions throw (unhandled)', async (t) => {
  try {
    await (async () => testObj.pThrows().then())();
  } catch(err) {
    t.equal(err.message, 'Intentional Throw!');
  }
});

