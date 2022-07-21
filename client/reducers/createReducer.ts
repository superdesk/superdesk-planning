export function createReducer<T = any>(initialState: T, reducerMap: {[key: string]: (state: T, payload: any) => T}) {
    return (state = initialState, action) => {
        const reducer = reducerMap[action.type];

        if (reducer) {
            return reducer(state, action.payload);
        } else {
            return {
                ...initialState,
                ...state,
            };
        }
    };
}
