import {ISuperdesk} from 'superdesk-api';

// will be set asynchronously on planning module start
// members can't be accessed in root module scope synchronously
export const superdeskApi = {} as ISuperdesk;