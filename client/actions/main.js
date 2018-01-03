import {MAIN} from '../constants';
import {activeFilter} from '../selectors/main';
import planningUi from './planning/ui';
import eventsUi from './events/ui';
import {selectAgenda, fetchSelectedAgendaPlannings} from './agenda';

const edit = (item) => ({
    type: MAIN.ACTIONS.EDIT,
    payload: item
});

const cancel = () => self.edit(null);

const closePreview = () => self.preview(null);

const preview = (item) => ({
    type: MAIN.ACTIONS.PREVIEW,
    payload: item
});

const filter = (ftype = null) => (
    (dispatch, getState, {$timeout, $location}) => {
        let filterType = ftype;

        if (filterType === null) {
            filterType = $location.search().filter ||
                activeFilter(getState()) ||
                MAIN.FILTERS.COMBINED;
        }

        dispatch({
            type: MAIN.ACTIONS.FILTER,
            payload: filterType,
        });

        // Update the url (deep linking)
        $timeout(() => $location.search('filter', filterType));

        if (filterType === MAIN.FILTERS.EVENTS) {
            dispatch(planningUi.clearList());
            return dispatch(eventsUi.fetchEvents({
                fulltext: JSON.parse(
                    $location.search().searchEvent || '{}'
                ).fulltext,
            }));
        } else if (filterType === MAIN.FILTERS.PLANNING) {
            dispatch(eventsUi.clearList());
            const searchAgenda = $location.search().agenda;

            if (searchAgenda) {
                return dispatch(selectAgenda(searchAgenda));
            }

            return dispatch(
                fetchSelectedAgendaPlannings()
            );
        }

        return Promise.resolve();
    }
);

// eslint-disable-next-line consistent-this
const self = {
    edit,
    cancel,
    closePreview,
    preview,
    filter,
    history,
};

export default self;
