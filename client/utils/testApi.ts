import {superdeskApi, planningApi} from '../superdeskApi';
import {cloneDeep} from 'lodash';
import {initialState} from './testData';
import sinon from 'sinon';

Object.assign(superdeskApi, {
    localization: {
        gettext: (text) => text,
    },
    dataApi: {
        queryRawJson: sinon.stub().returns(Promise.resolve({
            _items: [],
            _links: {},
            _meta: {},
        })),
        findOne: sinon.stub().returns(Promise.resolve({})),
    },
});

Object.assign(planningApi, {
    redux: {
        store: {
            getState: () => cloneDeep(initialState),
        },
    },
});
