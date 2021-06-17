import {get} from 'lodash';

export const mainMenuOpen = (state) => get(state, 'workspace.mainMenuOpen', false);