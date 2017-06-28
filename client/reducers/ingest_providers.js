import { cloneDeep } from 'lodash'

const initialState = { providers: [] }

const ingest = (state=initialState, action) => {
    switch (action.type) {
        case 'RECEIVE_INGEST_PROVIDERS':
            var _providers = cloneDeep(state.providers)
            action.payload.forEach((provider) => _providers.push({
                name: provider.name,
                id: provider._id,
            }))
            return {
                ...initialState,
                providers: _providers,
            }
        default:
            return state
    }
}

export default ingest
