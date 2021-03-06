import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { registerPreloadFunction, markPreloadAsResolved } from "./store";

export const IS_RESOLVING = "is_resolving";
export const IS_RESOLVED = "is_resolved";

const preload = (functions, options = {}) => {
  /**
   * Set default options for the Component
   * - placeholder - a Component to be rendered while the preload functions
   *   are still being resolved
   * - dontCache - by default all the resolvers are cached and not executed
   *   a second time they are encountered, if it's needed you can remove the
   *   cache, or decide to not store this preloader in the cache at all
   * - ttl - time, after which function is to be considered no longer cached
   */
  options = Object.assign({}, {
    placeholder: null,
    showComponentWhileLoading: false,
    dontCache: false,
    ttl: -1
  }, options);

  /**
   * Create an map of all the preload function and add the correct initial state
   */
  let preloadFunctions = {};
  Object.keys(functions).forEach(key => {
    preloadFunctions[key] = {
      fn: functions[key],
      stage: IS_RESOLVING
    }
  });


  const factory = (Component) => {

    function next(key, nextResolveParams = null) {
      /**
       * Mark given preload function as resolved internally
       */
      preloadFunctions = Object.assign({}, preloadFunctions, {
        [key]: Object.assign({}, preloadFunctions[key], {
          stage: IS_RESOLVED
        })
      });

      /**
       * Mark the resolution of the preload function in redux
       */
      this.props.markPreloadAsResolved(key);

      const nextState = {};

      /**
       * Check if all the preloader functions are now resolved
       * and if so, update the component to be also resolved
       */
      if(Object.values(preloadFunctions).filter(preloadItem => {
        return preloadItem.stage === IS_RESOLVED;
      }).length === Object.values(preloadFunctions).length) {
        nextState.stage = IS_RESOLVED
      }

      if(nextResolveParams !== null) {
        nextState.resolveParams = Object.assign({}, this.state.resolveParams, nextResolveParams);
      }

      this.setState(nextState);
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
          stage: IS_RESOLVING,
          resolveParams: {}
        }

        /**
         * Reset the preload state bound to each indeividual preload function
         * for when we re-use the same HoC definition
         */
        Object.keys(preloadFunctions).forEach(key => {
          preloadFunctions[key] = Object.assign({},
            preloadFunctions[key],
            { stage: IS_RESOLVING }
          );
        });

        this.removeOwnProps = this.removeOwnProps.bind(this);
      }

      removeOwnProps() {
        const passedProps = Object.assign({}, this.props);
        delete passedProps.preloadFunctions;
        delete passedProps._dispatch;
        delete passedProps.registerPreloadFunction;
        delete passedProps.markPreloadAsResolved;

        return passedProps;
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
            if(item.fn === key && item.stage === IS_RESOLVED) {
              if(item.ttl !== -1) {
                return item.ttl > (new Date()).getTime()
              }
              else {
                return true;
              }
            }
            return false;
          }).length !== 0) {
            next.bind(this, key).call();
            return;
          }

          // @TODO what to do when an preloadFunction is already resolving?

          /**
           * We are placing the resolver function status into redux so that
           * we can keep track of it, and not repeat the resolving phase if not
           * needed. You can use the dontCache flag to skip this phase for given
           * component
           */
          if(!options.dontCache) {
            this.props.registerPreloadFunction({
              fn: key,
              stage: IS_RESOLVING,
              ttl: options.ttl === -1 ? -1 : (new Date()).getTime() + (options.ttl)
            });
          }

          /**
           * If the preload function was not yet resolved, call it and pass
           * redux `dispatch()`, and our `next()` callback
           */
          (preloadFunctions[key].fn).apply(this, [
            next.bind(this, key), this.props._dispatch, this.removeOwnProps()
          ]);
        })
      }

      render() {
        /**
         * Pass all the props we've received but make sure not to leak
         * the props specific to our component
         */
        const props = this.removeOwnProps();

        if(options.showComponentWhileLoading === true || this.state.stage === IS_RESOLVED) {
          return React.createElement(Component, Object.assign({}, props, this.state.resolveParams));
        }
        else {
          if(typeof options.placeholder === 'function') {
            return options.placeholder(Object.assign({}, props, this.state.resolveParams));
          }
          return options.placeholder;
        }
      }
    }

    PreloadComponent.displayName = 'PreloadComponent';

    PreloadComponent.propTypes = {
      preloadFunctions: PropTypes.array,
      markPreloadAsResolved: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
      registerPreloadFunction: PropTypes.func,
      _dispatch: PropTypes.func,
    }

    return connect((store) => ({
      preloadFunctions: store.preload.preloaders
    }), (dispatch) => ({
      _dispatch: dispatch,
      markPreloadAsResolved: (...p) => dispatch(markPreloadAsResolved(...p)),
      registerPreloadFunction: (...p) => dispatch(registerPreloadFunction(...p))
    }))(PreloadComponent);
  }

  return factory;
}

export default preload;
