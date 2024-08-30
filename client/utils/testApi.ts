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
    },
    components: {
        SelectUser: sinon.stub().returns('<div>Stubbed SelectUser Component</div>'),
    },
    entities: {
        contentProfile: {
            get: sinon.stub().returns(Promise.resolve({
                schema: {
                    slugline: {maxlength: 24, type: 'string', required: true},
                    relatedItems: {},
                    genre: {type: 'list'},
                    anpa_take_key: {type: 'string'},
                    place: {type: 'list'},
                    priority: {type: 'integer'},
                    urgency: {type: 'integer'},
                    anpa_category: {type: 'list', required: true},
                    subject: {type: 'list', required: true},
                    company_codes: {type: 'list'},
                    ednote: {type: 'string'},
                    headline: {maxlength: 42, type: 'string', required: true},
                    sms: {maxlength: 160, type: 'string'},
                    abstract: {maxlength: 160, type: 'string'},
                    body_html: {required: true, type: 'string'},
                    byline: {type: 'string'},
                    dateline: {type: 'dict', required: true},
                    sign_off: {type: 'string'},
                    footer: {},
                    body_footer: {type: 'string'},
                },
            })),
        },
    },
});

Object.assign(planningApi, {
    redux: {
        store: {
            getState: () => cloneDeep(initialState),
        },
    },
});
