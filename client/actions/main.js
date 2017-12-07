import {MAIN} from '../constants';

const edit = (item) => ({
    type: MAIN.ACTIONS.EDIT,
    payload: item
});

const cancel = () => self.edit(null);

const preview = (item) => ({
    type: MAIN.ACTIONS.PREVIEW,
    payload: item
});

const filter = (filterType) => ({
    type: MAIN.ACTIONS.FILTER,
    payload: filterType,
});

// eslint-disable-next-line consistent-this
const self = {
    edit,
    cancel,
    preview,
    filter,
};

export default self;
