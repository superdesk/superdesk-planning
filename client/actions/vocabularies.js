export function loadCategories() {
    return (dispatch, getState, { vocabularies }) => {
        vocabularies.getAllActiveVocabularies().then((voc) => (
            dispatch({
                type: 'RECEIVE_ANPA_CATEGORIES',
                payload: voc._items.filter((item) => item._id === 'categories')[0].items,
            })
        ))
    }
}
