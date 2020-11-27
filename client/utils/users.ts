import {IDesk} from 'superdesk-api';
import {getUserInterfaceLanguage} from 'appConfig';

import {planningApi} from '../superdeskApi';
import {defaultDesk} from '../selectors/general';


export function getUsersDefaultLanguage(): string {
    const desk: IDesk | null = defaultDesk(planningApi.redux.store.getState());

    return desk?.desk_language?.length ?
        desk.desk_language :
        getUserInterfaceLanguage();
}
