const formsProfile = (state={}, action) => {
    switch (action.type) {
        case 'RECEIVE_FORMS_PROFILE':
            action.payload.forEach((p) => {
                state[p.name] = p
            })

            return state

        default:
            return state
    }
}

export default formsProfile
