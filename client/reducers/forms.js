import { reducer as formReducer, actionTypes } from 'redux-form'
import { cloneDeep, get } from 'lodash'
import moment from 'moment'
import { RESET_STORE, INIT_STORE } from '../constants'
import { eventUtils } from '../utils/index'

const forms = formReducer.plugin({
    // 'addEvent' is the name of the form given to reduxForm()
    addEvent: (state={}, action) => {
        if (action.type === RESET_STORE) {
            return null
        } else if (action.type === INIT_STORE) {
            return {}
        } else if (action.type !== actionTypes.CHANGE ||
            get(action, 'meta.form', '') !== 'addEvent') {
            return state
        }

        // if count or until is set, reset the other field
        if (action.payload) {
            let newState = cloneDeep(state)
            if (action.meta.field === 'dates.recurring_rule.count') {
                newState.values.dates.recurring_rule.until = undefined
                return newState
            } else if (action.meta.field === 'dates.recurring_rule.until') {
                newState.values.dates.recurring_rule.count = undefined
                return newState
            }
        }

        return state
    },

    // 'updateEventConfirmation' is the name of the form given to reduxForm
    updateEventConfirmation: (state, action) =>
        (eventUtils.getRelatedEventsForRecurringEvent(state, action)),
    updateTime: (state, action) => (eventUtils.getRelatedEventsForRecurringEvent(state, action)),

    spikeEvent: (state, action) => (eventUtils.getRelatedEventsForRecurringEvent(state, action)),
    postponeEvent: (state, action) => (eventUtils.getRelatedEventsForRecurringEvent(state, action)),
    cancelEvent: (state, action) => (eventUtils.getRelatedEventsForRecurringEvent(state, action)),
    rescheduleEvent: (state, action) => (
        eventUtils.getRelatedEventsForRecurringEvent(state, action)
    ),

    // 'planningAdvancedSearch' is the name of the form given to reduxForm
    planningAdvancedSearch: (state={}, action) => {
        if (action.type !== actionTypes.CHANGE ||
            get(action, 'meta.form', '') !== 'planningAdvancedSearch') {
            return state
        }

        let values = state.values
        if (get(action, 'meta.field', '') === 'dates.range' && get(values, 'dates.range') !== '') {
            return {
                ...state,
                values: {
                    ...values,
                    dates: { range: get(values, 'dates.range') },
                },
            }
        } else if ((get(action, 'meta.field', '') === 'dates.start' &&
                moment.isMoment(get(values, 'dates.start'))) ||
            (get(action, 'meta.field', '') === 'dates.end'  &&
                moment.isMoment(get(values, 'dates.end')))) {
            return {
                ...state,
                values: {
                    ...values,
                    dates: {
                        start: get(values, 'dates.start', null),
                        end: get(values, 'dates.end', null),
                    },
                },
            }
        } else {
            return { ...state }
        }
    },
})

export default forms
