import { find, get } from 'lodash'

export function loadCategories() {
    return (dispatch, getState, { vocabularies }) => {
        vocabularies.getAllActiveVocabularies().then((voc) => (
            dispatch({
                type: 'RECEIVE_ANPA_CATEGORIES',
                payload: get(find(voc._items, (item) => item._id === 'categories'), 'items', []),
            })
        ))
    }
}
