import {INITIAL_STATE} from '../constants';

export function createReducer<T = any>(initialState: T, reducerMap: {[key: string]: (state: T, payload: any) => T}) {
    return (state = initialState, action) => {
        const reducer = reducerMap[action.type];

        if (reducer) {
            return reducer(state, action.payload);
        } else if (action.type === INITIAL_STATE) {
            // workaround to handle createStore with only subset of initial state
            return {...initialState, ...state};
        } else {
            // no reducer matched, return current state
            return state;
        }
    };
}
