import {cloneDeep} from 'lodash';
import sinon from 'sinon';

import {querySelectorParent} from 'superdesk-core/scripts/core/helpers/dom/querySelectorParent';
import {superdeskApi, planningApi} from '../superdeskApi';


import {initialState, privileges} from './testData';
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
        dateToServerString: (date) => date.toISOString().slice(0, 19) + '+0000',
    },
    privileges: {
        hasPrivilege: (privilege: string) => privileges[privilege] === 1
    },
    ui: {
        notify: {
            success: sinon.stub().returns(undefined),
            error: sinon.stub().returns(undefined),
        }
    }
});

Object.assign(planningApi, {
    redux: {
        store: {
            getState: () => cloneDeep(initialState),
        },
    },
});
