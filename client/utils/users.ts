import {IDesk} from 'superdesk-api';
import {getUserInterfaceLanguage} from 'appConfig';

import {planningApi} from '../superdeskApi';
import {defaultDesk} from '../selectors/general';
import {getLanguages} from '../selectors/vocabs';


export function getUsersDefaultLanguage(useCV: boolean = false, required: boolean = true): string {
    const state = planningApi.redux.store.getState();
    const desk: IDesk | null = defaultDesk(state);

    const language = desk?.desk_language?.length ?
        desk.desk_language :
        getUserInterfaceLanguage();

    if (useCV) {
        const languages = getLanguages(state);

        if (languages.findIndex((l) => l.qcode === language) === -1) {
            // The configured language is not available in the CV
            // This can happen where 'en-CA' is used instead of 'en'
            // Return the first entry that starts with `language`
            const cvLanguage = languages.find(
                (l) => (
                    l.qcode.startsWith(`${language}_`) ||
                    l.qcode.startsWith(`${language}-`)
                )
            )?.qcode;

            // If the language is required and one was not found from the CV
            // then return the first entry in the CV
            return (required && cvLanguage == null) ?
                // if languages CV is not defined, then return User's language
                (languages[0]?.qcode ?? language) :
                cvLanguage;
        }
    }

    return language;
}
