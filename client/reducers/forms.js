import { reducer as formReducer, actionTypes } from 'redux-form'
import { cloneDeep } from 'lodash'

const forms = formReducer.plugin({
    // 'addEvent' is name of form given to reduxForm()
    addEvent: (state={}, action) => {
        switch (action.type) {
            case actionTypes.CHANGE:
                // if count or until is set, reset the other field
                if (action.payload) {
                    var newState = cloneDeep(state)
                    if (action.meta.field === 'dates.recurring_rule.count') {
                        newState.values.dates.recurring_rule.until = undefined
                        return newState
                    } else if (action.meta.field === 'dates.recurring_rule.until') {
                        newState.values.dates.recurring_rule.count = undefined
                        return newState
                    }
                }

                return state
            default:
                return state
        }
    },
})

export default forms
