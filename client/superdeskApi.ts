import {ISuperdesk} from 'superdesk-api';
import {IPlanningAPI} from './interfaces';
import {planningApis} from './api';

// will be set asynchronously on planning module start
// members can't be accessed in root module scope synchronously

// DO NOT USE OUTSIDE .ts OR .tsx FILES
// because it would make it harder to find and update usages when API changes

export const superdeskApi = {} as ISuperdesk;

export const planningApi = planningApis as IPlanningAPI;
