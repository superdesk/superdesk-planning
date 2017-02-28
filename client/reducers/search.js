/*eslint-disable complexity*/
const search = (state={}, action) => {
    switch (action.type) {
        case 'OPEN_ADVANCED_SEARCH':
            return { ...state, advancedSearchOpened: true }
        case 'CLOSE_ADVANCED_SEARCH':
            return { ...state, advancedSearchOpened: false }
        default:
            return state
    }
}
/*eslint-enable*/

export default search
