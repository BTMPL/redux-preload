# redux-preload

A small loader HoC that helps you deffer the rendering of your Components untill an (asynchronous) action or actions finish.

## Example

@TODO add info about reducer

```javascript
import { preload } from "redux-preload";

const OriginalComponent = () => {
  return <div>Preload completed</div>
}

/**
 * Define the preload action, it will receive a `next` callback that should be
 * called once the desired criteria - data computed or fetched from remote
 * source are met
 */
const waitOneSecond = (next) => {
  setTimeout(next, 1000);
}

/**
 * Wrap our Component in the preload HoC and pass a set of preload actions to
 * be completed (in parallel) before the component is rendered.
 */
const Preload = preload({
  preloader: waitOneSecond
})(OriginalComponent);

const App = () => {
  return (
    <div>
      <p>Example, should load after 1 second:</p>
      <Preload />
    </div>
  );
}
```

## API

### preload()

```javascript
import { preload } from "redux-preload";
preload(preloadFunctions, [options, props])(Component);
```

`preloadFunctions` should be an Object which every key will be considered a preload function to be evaluated before rendering the Component. Each of the functions will be called with following parameters:

- `next` - a callback to be called after the preloadFunction should be considered resolved

If you call the callback with an `Object` it will be spread as props onto the `Component` that will be rendered in the end. Multiple calls to `next` (eg. in multiple preloader functions) will be merged together.

- `dispatch` - Redux `dispatch()` function attached to the current store supplied by `react-redux` `<Provider />`
- `props` - the props passed to the Component while rendering

`options` - optional secondary parameter with following keys:

- `placeholder` - default: `null` - a component to be rendered while the `preloadFunctions` are being evaluated
- `dontCache` - default: `false` - by default each of the `preloadFunctions` is marked as completed, and stored in redux, so that subsequent calls to given preload functions are immediately considered resolved, set to `true` to skip caching current request
- `showComponentWhileLoading` - default: `false` - if set to true the component will be returned right away, and updated as preloader functions resolv. This mode can be used to support basic cache, as its rendering more does not differ from just rendering the same component while the data is still loading.

`props` - default: `{}` - props passed to the HoC

### clearPreloadFunction()

```javascript
import { clearPreloadFunction } from "redux-preload";
preload({preloadFunctionId: preloadFunction})(Component);
store.dispatch(clearPreloadFunction("preloadFunctionId"));
```

Used to clear the information about resolution of given preloadFunction from the Redux store.

## License

MIT