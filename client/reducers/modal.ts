import {get} from 'lodash';

const initialState = {
    modalType: null,
    modalProps: undefined,
    previousState: undefined,
    actionInProgress: false,
};

function setActionInProgress(state, value) {
    if (state == null) {
        return state;
    }

    return {
        ...state,
        actionInProgress: value,
        previousState: setActionInProgress(state.previousState, value),
    };
}

const modal = (state = initialState, action) => {
    switch (action.type) {
    case 'SHOW_MODAL':
        return {
            modalType: action.modalType,
            modalProps: action.modalProps,
            previousState: state,
        };
    case 'HIDE_MODAL':
        if (get(action, 'payload.clearPreviousState')) {
            return initialState;
        }

        return state.previousState || initialState;
    case 'ACTION_IN_PROGRESS':
        return setActionInProgress(state, action.payload);
    case 'MODAL_CLEAR_PREVIOUS':
        return {
            ...state,
            previousState: undefined,
        };
    case 'RESET_STORE': {
        return {...initialState};
    }
    default:
        return state;
    }
};

export default modal;
