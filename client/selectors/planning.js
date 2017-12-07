import {get} from 'lodash';

export const storedPlannings = (state) => get(state, 'planning.plannings');
