import {cloneDeep} from 'lodash';
import sinon from 'sinon';

import {querySelectorParent} from 'superdesk-core/scripts/core/helpers/dom/querySelectorParent';
import {superdeskApi, planningApi} from '../superdeskApi';


import {initialState} from './testData';

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
        create: sinon.stub().callsFake((resource, item) => Promise.resolve({...item}))
    },
    browser: {
        location: {
            urlParams: {
                getString: () => undefined,
                setString: () => undefined,
            }
        }
    },
    utilities: {
        querySelectorParent: querySelectorParent,
    },
});

Object.assign(planningApi, {
    redux: {
        store: {
            getState: () => cloneDeep(initialState),
        },
    },
});
