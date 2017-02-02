
export function loadCVocabularies() {
    return (dispatch, getState, { vocabularies }) => {
        vocabularies.getAllActiveVocabularies().then((voc) => (
            dispatch({
                type: 'RECEIVE_VOCABULARIES',
                payload: voc._items,
            })
        ))
    }
}
