import { reducer as formReducer } from 'redux-form'

const forms = formReducer.plugin({
    addEvent: (state, action) => { // <------ 'addEvent' is name of form given to reduxForm()
        switch (action.type) {
            case 'EVENT_SAVE_SUCCESS':
                return undefined; // <--- blow away form data
            default:
                return state;
        }
    }
})

export default forms
