import global from './global.js';

const noop = ()=>{};

/**
 * Evaluation of the propery chain (aka. path) but with `await` at each
 * step in the chain to properly handle promises in the chain.
 *
 * @param {any} obj - The root object of the path we want to descend
 * @param {string[]} path - An array of property names
 */
const findVal = async (obj, path) => {
  let currentVal = await obj;
  let prevVal = undefined;
  let part;

  while (part = path.shift()) {
    prevVal = currentVal;
    currentVal = await currentVal[part];
  }

  return [currentVal, prevVal];
};

/**
 * Used to generate the `then` function. This is most often done at
 * end of chain of property accesses so this kicks off the actual
 * resolution of the property chain to get a value.
 *
 * @param {any} obj - The root object of the path we want to descend
 * @param {string[]} path - An array of property names
 * @returns {async (thener: function?, catcher: function?) => any}
 */
const thenGenerator = (obj, path) => async (thener, catcher) => {
  let finalVal;

  try  {
    [finalVal] = await findVal(obj, path);
  } catch(err) {
    if (typeof catcher === 'function') {
      catcher(err);
    } else {
      throw err;
    }
  }

  if (typeof thener === 'function') {
    return thener(finalVal);
  }

  return finalVal;
};

/**
 * Execute a function and make the return function await-all-able.
 *
 * @param {any} obj - The root object of the path we want to descend
 * @param {string[]} path - An array of property names
 */
const fnRunner = async (obj, path, args) => {
  const [fn, context] = await findVal(obj, path);

  try {
    if (context) {
      // Native functions are REALLY picky about the context you provide
      // and will often not accept a proxy to a specific object but require
      // the object itself
      const contextConstructor = context.constructor;
      if (contextConstructor !== null &&
        contextConstructor !== Object &&
        /\[native code\]/i.test(contextConstructor.toString())) {
        return await fn.apply(context, args);
      }

      // Wrap the context in a proxy so that we can use simple single-await
      // syntax on `this` inside our functions too!
      const awaitAllContext = overwait(context);
      return await fn.apply(awaitAllContext, args);
    }

    return await fn.apply(global, args);
  } catch(err) {
    throw err;
  }
};

/**
 * Create a proxy "handler" object that intercepts get and apply to
 * allow us to override the behavior of property accessors and
 * function invocation on an object.
 *
 * @param {any} obj - The root object of the path we want to descend
 * @param {string[]} path - An array of property names
 * @returns {object}
 */
const getHandler = (obj, path) => {
  return {
    // We have to wrap the return value of any function execution because
    // the property access chain might continue after the call
    apply: (target, thisArg, args) => overwait(fnRunner(obj, path, args)),

    get: (target, prop, receiver) => {
      // "then" triggers the resolution of the path to this point
      if (prop === 'then') {
        return thenGenerator(obj, path)
      }

      // otherwise, we just store the path and continue descending
      return overwait(obj, [...path, prop]);
    }
  };
};

/**
 * Take an object and wrap it in a proxy that intercepts property
 * accesses to enable a single await statement to "await" for promises
 * at all levels of the property chain.
 *
 * @param {any} obj - The root object we want ot make await-all-able
 * @returns {Proxy}
 */
const overwait = (obj, path = []) => {
  // Note that the proxy is ALWAYS of type function. This doesn't interfere
  // with standard objects because all functions ARE objects. But if we didn't
  // have the Proxy be a function type then we couldn't intercept the
  // apply above.
  const p = new Proxy(noop, getHandler(obj, path));
  return p;
};

export default overwait;
