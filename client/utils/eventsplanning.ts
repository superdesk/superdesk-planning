import {FILTER_TYPE} from '../interfaces';
import {superdeskApi} from '../superdeskApi';

const defaultFilterValues = () => (
    {
        name: '',
        item_type: FILTER_TYPE.COMBINED,
        params: {},
    }
);

export function getItemTypeOptionName(name: FILTER_TYPE | 'event') {
    const {gettext} = superdeskApi.localization;

    switch (name ?? FILTER_TYPE.COMBINED) {
    case FILTER_TYPE.EVENTS:
        return gettext('Events');
    case 'event':
        return gettext('Events');
    case FILTER_TYPE.PLANNING:
        return gettext('Planning');
    case FILTER_TYPE.COMBINED:
        return gettext('Both');
    }

    return gettext('Both');
}

// eslint-disable-next-line consistent-this
const self = {defaultFilterValues};

export default self;
