import {RESET_STORE, INIT_STORE} from '../constants';

const initialState = {
    currentDeskId: null,
    currentStageId: null,
    currentWorkspace: null,
    mainMenuOpen: null,
};

const workspace = (state = initialState, action) => {
    switch (action.type) {
    case RESET_STORE:
        return {
            ...state,
            currentWorkspace: null,
        };
    case INIT_STORE:
        return {
            ...state,
            currentWorkspace: action.payload,
        };
    case 'WORKSPACE_CHANGE':
        return {
            ...state,
            ...action.payload,
        };
    case 'MENU_OPEN':
        return {
            ...state,
            mainMenuOpen: action.payload,
        };
    default:
        return state;
    }
};

export default workspace;
