import { IS_RESOLVED } from "./preload";

export const PRELOAD_FUNCTION_REGISTER = "PRELOAD_FUNCTION_REGISTER";
export const PRELOAD_FUNCTION_RESOLVED = "PRELOAD_FUNCTION_RESOLVED";
export const PRELOAD_FUNCTION_CLEAR = "PRELOAD_FUNCTION_CLEAR";

export const registerPreloadFunction = (obj) => {
  return {
    type: PRELOAD_FUNCTION_REGISTER,
    payload: obj
  }
}

export const markPreloadAsResolved = (fn) => {
  return {
    type: PRELOAD_FUNCTION_RESOLVED,
    payload: fn
  }
}

export const clearPreloadFunction = (fn) => {
  return {
    type: PRELOAD_FUNCTION_CLEAR,
    payload: fn
  }
}

const initialState = {
  preloaders: []
};

const store = (state = initialState, action) => {
  switch(action.type) {
    case PRELOAD_FUNCTION_REGISTER:
      return Object.assign({}, state, { preloaders: [...state.preloaders, action.payload]})

    case PRELOAD_FUNCTION_RESOLVED:
      return Object.assign({}, state, { preloaders: [...state.preloaders.map(item => {
        if(item.fn === action.payload) item.state = IS_RESOLVED;
        return item;
      })]})

    case PRELOAD_FUNCTION_CLEAR:
      return Object.assign({}, state, { preloaders: [...state.preloaders.filter(item => item.fn !== action.payload)]})      ;
  }
  return state;
}

export default store;