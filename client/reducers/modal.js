import {get} from 'lodash';

const initialState = {
    modalType: null,
    modalProps: undefined,
    previousState: undefined,
    actionInProgress: false,
};

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
        return {
            ...state,
            actionInProgress: action.payload,
        };
    default:
        return state;
    }
};

export default modal;
