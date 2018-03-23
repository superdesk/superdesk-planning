import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import {cloneDeep} from 'lodash';

import * as helpers from '../../tests/helpers';
import * as selectors from '../../../selectors';
import {createTestStore} from '../../../utils';
import {getTestActionStore, waitFor} from '../../../utils/testUtils';
import {MAIN} from '../../../constants';

import {PlanningApp} from '../../../apps';
import {PanelInfo} from '../../UI';
import {EventItem} from '../../Events';
import {PlanningItem} from '../../Planning';


describe('PlanningApp', () => {
    let store;
    let astore;
    let services;
    let search = {
        currentSearch: {
            advancedSearch: {
                dates: {
                    start: '2010-10-15T15:01:11+0000',
                    end: '2020-10-15T15:01:11+0000',
                }
            }
        },
        lastRequestParams: {
            advancedSearch: {
                dates: {
                    start: '2010-10-15T15:01:11+0000',
                    end: '2020-10-15T15:01:11+0000',
                }
            }
        }
    };

    beforeEach(() => {
        astore = getTestActionStore();
        services = astore.services;
        astore.initialState.main.filter = MAIN.FILTERS.COMBINED;
        astore.initialState.main.search[MAIN.FILTERS.COMBINED] = cloneDeep(search);
        astore.initialState.main.search[MAIN.FILTERS.EVENTS] = cloneDeep(search);
        astore.initialState.main.search[MAIN.FILTERS.PLANNING] = cloneDeep(search);
    });

    const initStore = () => {
        astore.init();
        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {
                api: services.api,
                $location: services.$location,
            },
        });
    };

    const getWrapper = () => mount(
        <Provider store={store}>
            <PlanningApp />
        </Provider>
    );

    // TODO: To be revisited
    xit('renders the Planning App', (done) => {
        initStore();
        const wrapper = getWrapper();
        const app = new helpers.main.Main(wrapper);

        expect(app.isMounted).toBe(true);
        expect(app.filters.isMounted).toBe(true);
        expect(app.list.isMounted).toBe(true);
        expect(app.preview.isMounted).toBe(true);
        expect(app.editor.isMounted).toBe(true);
        expect(app.subNavBar.isMounted).toBe(true);
        expect(app.subNavBar.multiActionBarHidden).toBe(true);

        expect(services.api('events').query.callCount).toBe(0);
        expect(services.api('planning').query.callCount).toBe(0);
        expect(app.list.element.find(PanelInfo).length).toBe(1);
        app.filters.events.click();
        waitFor(() => selectors.events.orderedEvents(store.getState()).length > 0)
            .then(() => {
                expect(app.filters.activeFilter()).toBe(MAIN.FILTERS.EVENTS);
                expect(services.api('events').query.callCount).toBe(1);
                expect(services.api('planning').query.callCount).toBe(0);
                expect(app.list.element.find(PanelInfo).length).toBe(0);
                expect(app.list.element.find(EventItem).length).toBe(3);

                app.filters.planning.click();
                return waitFor(() => selectors.planning.orderedPlanningList(store.getState()).length > 0);
            })
            .then(() => {
                expect(app.filters.activeFilter()).toBe(MAIN.FILTERS.PLANNING);
                expect(services.api('events').query.callCount).toBe(1);
                expect(services.api('planning').query.callCount).toBe(1);
                expect(app.list.element.find(PanelInfo).length).toBe(0);
                expect(app.list.element.find(PlanningItem).length).toBe(2);

                done();
            });
    });

    // TODO: To be revisited
    xit('renders MultiSelectActions bar if list item is multi selected', (done) => {
        astore.initialState.main.filter = MAIN.FILTERS.EVENTS;
        astore.initialState.multiSelect.selectedEventIds = ['e1'];
        initStore();
        const wrapper = getWrapper();
        const app = new helpers.main.Main(wrapper);

        expect(app.isMounted).toBe(true);
        expect(app.filters.isMounted).toBe(true);
        expect(app.list.isMounted).toBe(true);
        expect(app.preview.isMounted).toBe(true);
        expect(app.editor.isMounted).toBe(true);
        expect(app.subNavBar.isMounted).toBe(true);
        expect(app.subNavBar.multiActionBarHidden).toBe(false);
        done();
    });
});
