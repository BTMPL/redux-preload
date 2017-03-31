import React from "react";
import { connect } from "react-redux";
import { registerPreloadFunction, markPreloadAsResolved } from "./store";

export const IS_RESOLVING = "is_resolving";
export const IS_RESOLVED = "is_resolved";

const preload = (preloadFunctions, options = {}) => {
  /**
   * Set default options for the Component
   * - placeholder - a Component to be rendered while the preloadFunctions
   *   are still being resolved
   * - dontCache - by default all the resolvers are cached and not executed
   *   a second time they are encountered, if it's needed you can remove the
   *   cache, or decide to not store this preloader in the cache at all
   */
  options = Object.assign({}, {
    placeholder: null,
    dontCache: false,
  }, options);

  preloadFunctions = Object.assign({}, preloadFunctions);
  Object.keys(preloadFunctions).forEach(key => {
    preloadFunctions[key] = {
      fn: preloadFunctions[key],
      status: IS_RESOLVING
    }
  });


  const factory = (Component) => {

    function next(key) {
      /**
       * Mark given preload function as resolved internally
       */
      preloadFunctions = Object.assign({}, preloadFunctions, {
        [key]: Object.assign({}, preloadFunctions[key], {
          state: IS_RESOLVED
        })
      });

      /**
       * Mark the resolution of the preload function in redux
       */
      this.props.markPreloadAsResolved(key);

      /**
       * Check if all the preloader functions are now resolved
       * and if so, update the component to be also resolved
       */
      if(Object.values(preloadFunctions).filter(preloadItem => {
        return preloadItem.state === IS_RESOLVED;
      }).length === Object.values(preloadFunctions).length) {
        this.setState({
          state: IS_RESOLVED
        })
      }
    }

    /**
     * This is the actual HoC that will be mounted in your applicaiton JSX
     * Its purpose is only to provide the loading / loaded functionality
     * and update in response to preload functions being resolved
     */
    class PreloadComponent extends React.Component {

      constructor(...p) {
        super(...p);

        this.state = {
          state: IS_RESOLVING
        }
      }

      componentDidMount() {
        /**
         * Itterate over all the preload functions calling them if needed
         */
        Object.keys(preloadFunctions).forEach(key => {
          /**
           * Check if this particular preload function was already resolved
           * and if so, skip it.
           */
          if(this.props.preloadFunctions.filter(item => {
            return item.fn === key && item.state === IS_RESOLVED
          }).length === 1) {
            next.bind(this, key).call();
            return;
          }

          /**
           * If the preload function was not yet resolved, call it and pass
           * redux `dispatch()`, and our `next()` callback
           */
          (preloadFunctions[key].fn).apply(this, [
            next.bind(this, key), this.props._dispatch
          ]);

          /**
           * We are placing the resolver function status into redux so that
           * we can keep track of it, and not repeat the resolving phase if not
           * needed. You can use the dontCache flag to skip this phase for given
           * component
           */
          if(!options.dontCache) {
            this.props.registerPreloadFunction({
              fn: key,
              state: IS_RESOLVING
            });
          }
        })
      }

      render() {
        /**
         * Pass all the props we've received but make sure not to leak
         * the props specific to our component
         */
        const props = Object.assign({}, this.props);
        delete props.preloadFunctions;
        delete props._dispatch;
        delete props.registerPreloadFunction;
        delete props.markPreloadAsResolved;

        if(this.state.state === IS_RESOLVED) {
          return (
            <Component {...props} />
          )
        }
        else {
          return options.placeholder;
        }
      }
    }

    PreloadComponent.displayName = 'PreloadComponent';

    return connect((store) => ({
      preloadFunctions: store.preload.preloaders
    }), (dispatch) => ({
      _dispatch: dispatch,
      registerPreloadFunction: (...p) => dispatch(registerPreloadFunction(...p)),
      markPreloadAsResolved: (...p) => dispatch(markPreloadAsResolved(...p))
    }))(PreloadComponent);
  }

  return factory;
}

export default preload;
