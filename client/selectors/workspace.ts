import {get} from 'lodash';

export const workQueueOpen = (state) => get(state, 'workspace.workqueue', false);