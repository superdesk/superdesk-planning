import {createTestStore} from '../../utils';
import {mount} from 'enzyme';
import {EventsPanelContainer} from './index';
import React from 'react';
import {Provider} from 'react-redux';
import * as actions from '../../actions';

xdescribe('<EventPanelContainer />', () => {
    const eventId = '5800d71930627218866f1e80';
    const initialState = {
        events: {
            events: {
                [eventId]: {
                    _id: eventId,
                    dates: {start: '2016-10-15T13:01:11+0000'},
                    definition_short: 'definition_short 1',
                    location: [{name: 'location1'}],
                    name: 'name1',
                },
            },
            eventsInList: [eventId],
            search: {currentSearch: {}},
            readOnly: true,
        },
        privileges: {
            planning: 1,
            planning_event_management: 1,
        },
        users: [{_id: 'user123'}],
        session: {
            identity: {_id: 'user123'},
            sessionId: 'session123',
        },
        forms: {
            profiles: {
                events: {
                    editor: {
                        files: {enabled: true},
                        subject: {enabled: true},
                        name: {enabled: true},
                        links: {enabled: true},
                        anpa_category: {enabled: true},
                        calendars: {enabled: true},
                        definition_short: {enabled: true},
                        definition_long: {enabled: true},
                        slugline: {enabled: true},
                        occur_status: {enabled: true},
                        internal_note: {enabled: true},
                        location: {enabled: true},
                    },
                    schema: {
                        files: {
                            mandatory_in_list: null,
                            schema: null,
                            type: 'list',
                            required: false,
                        },
                        subject: {
                            mandatory_in_list: {scheme: {}},
                            schema: {
                                schema: {
                                    parent: {nullable: true},
                                    qcode: {},
                                    service: {nullable: true},
                                    name: {},
                                    scheme: {
                                        nullable: true,
                                        type: 'string',
                                        required: true,
                                        allowed: [],
                                    },
                                },
                                type: 'dict',
                            },
                            type: 'list',
                            required: false,
                        },
                        name: {
                            minlength: null,
                            type: 'string',
                            required: true,
                            maxlength: null,
                        },
                        links: {
                            mandatory_in_list: null,
                            schema: null,
                            type: 'list',
                            required: false,
                        },
                        anpa_category: {
                            mandatory_in_list: null,
                            schema: null,
                            type: 'list',
                            required: false,
                        },
                        calendars: {
                            mandatory_in_list: null,
                            schema: null,
                            type: 'list',
                            required: false,
                        },
                        definition_short: {
                            minlength: null,
                            type: 'string',
                            required: false,
                            maxlength: null,
                        },
                        definition_long: {
                            minlength: null,
                            type: 'string',
                            required: false,
                            maxlength: null,
                        },
                        location: {
                            minlength: null,
                            type: 'string',
                            required: false,
                            maxlength: null,
                        },
                        occur_status: {
                            mandatory_in_list: null,
                            schema: null,
                            type: 'list',
                            required: false,
                        },
                        internal_note: {
                            minlength: null,
                            type: 'string',
                            required: false,
                            maxlength: null,
                        },
                        slugline: {
                            minlength: null,
                            type: 'string',
                            required: false,
                            maxlength: null,
                        },
                    },
                },
            }
        },
    };
    const store = createTestStore({initialState});
    const wrapper = mount(
        <Provider store={store}>
            <EventsPanelContainer />
        </Provider>
    );

    it('Opens event in preview mode', () => {
        store.dispatch(actions.events.ui.previewEvent(store.getState().events.events[eventId]));
        expect(store.getState().events.showEventDetails).toBe(eventId);
        expect(store.getState().events.readOnly).toBe(true);
        store.dispatch(actions.events.ui.previewEvent({_id: eventId}));
        expect(store.getState().events.showEventDetails).toBe(eventId);
        wrapper.find('EventsPanel').props()
            .handleBackToList();
        expect(store.getState().events.readOnly).toBe(true);
    });

    it('Opens new event event in edit mode', () => {
        store.dispatch(actions.events.ui.openEventDetails());
        expect(store.getState().events.showEventDetails).toBe(true);
        expect(store.getState().events.readOnly).toBe(false);
        wrapper.find('EventsPanel').props()
            .handleBackToList();
        expect(store.getState().events.showEventDetails).toBe(null);
    });
});
