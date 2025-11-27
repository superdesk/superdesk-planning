export function createReducer<T = any>(initialState: T, reducerMap: {[key: string]: (state: T, payload: any) => T}) {
    return (state = initialState, action) => {
        const reducer = reducerMap[action.type];

        if (reducer) {
            return reducer(state, action.payload);
        } else if (action.type === '_INIT_STORE_') {
            // workaround to handle createStore with only subset of initial state
            return {...initialState, ...state};
        } else {
            return action != null && state != null ? state : {...initialState, ...state};
        }
    };
}
