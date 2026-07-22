import sinon from 'sinon';
import {Store} from 'redux';

import {superdeskApi, planningApi} from '../../superdeskApi';
import {AGENDA, EVENTS, EVENTS_PLANNING, MAIN, PLANNING} from '../../constants';
import {LIST_VIEW_TYPE, PLANNING_VIEW} from '../../interfaces';

import {restoreSinonStub} from '../../utils/testUtils';
import {createTestStore} from '../../utils';

describe('planningApi.ui.list', () => {
    let redux: Store;
    const mockSearchResponse = {
        _items: [],
        _links: {},
        _meta: {total: 10},
    };

    beforeEach(() => {
        jasmine.clock().install();
        redux = createTestStore();
        planningApi.redux.store = redux;
        sinon.stub(planningApi.redux.store, 'dispatch').callThrough();
        sinon.stub(planningApi.planning, 'search').callsFake(() => Promise.resolve(mockSearchResponse));
        sinon.stub(planningApi.events, 'search').callsFake(() => Promise.resolve(mockSearchResponse));
        sinon.stub(planningApi.combined, 'search').callsFake(() => Promise.resolve(mockSearchResponse));
        sinon.stub(superdeskApi.browser.location.urlParams, 'setString');
    });

    afterEach(() => {
        restoreSinonStub(planningApi.redux.store.dispatch);
        restoreSinonStub(planningApi.planning.search);
        restoreSinonStub(planningApi.events.search);
        restoreSinonStub(planningApi.combined.search);
        restoreSinonStub(superdeskApi.browser.location.urlParams.setString);
        // Advance past the throttle cooldown so the gate resets for the next test
        jasmine.clock().tick(2000);
        jasmine.clock().uninstall();
    });

    describe('reloadListPages', () => {
        it('returns null when forViewType does not match the current view', (done) => {
            // Set current view to EVENTS
            redux.dispatch({type: MAIN.ACTIONS.FILTER, payload: PLANNING_VIEW.EVENTS});

            // Requesting a PLANNING reload should not fire while on EVENTS view
            planningApi.ui.list.reloadListPages(PLANNING_VIEW.PLANNING)
                .then((result) => {
                    expect(result).toBeNull();
                    done();
                })
                .catch(done.fail);
        });

        it('triggers a reload when forViewType matches the current view', (done) => {
            redux.dispatch({type: MAIN.ACTIONS.FILTER, payload: PLANNING_VIEW.EVENTS});

            planningApi.ui.list.reloadListPages(PLANNING_VIEW.EVENTS)
                .then(() => {
                    expect(planningApi.events.search.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });

        it('always reloads when the current view is COMBINED, regardless of forViewType', (done) => {
            // Default state: filter is null → activeFilter returns PLANNING_VIEW.COMBINED
            planningApi.ui.list.reloadListPages(PLANNING_VIEW.EVENTS)
                .then(() => {
                    expect(planningApi.combined.search.callCount).toBe(1);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('clearList', () => {
        it('dispatches CLEAR_EVENTS_PLANNING_LIST for COMBINED view', () => {
            // Default state is COMBINED view
            planningApi.ui.list.clearList();

            const dispatched = redux.dispatch.args.map((a) => a[0]);

            expect(dispatched.some((action) => (
                action.type === EVENTS_PLANNING.ACTIONS.CLEAR_EVENTS_PLANNING_LIST
            ))).toBe(true);
        });

        it('dispatches CLEAR_EVENTS_LIST for EVENTS view', () => {
            redux.dispatch({type: MAIN.ACTIONS.FILTER, payload: PLANNING_VIEW.EVENTS});
            const priorCount = redux.dispatch.callCount;

            planningApi.ui.list.clearList();

            const newDispatches = redux.dispatch.args.slice(priorCount).map((a) => a[0]);

            expect(newDispatches.some((action) => (
                action.type === EVENTS.ACTIONS.CLEAR_LIST
            ))).toBe(true);
        });

        it('dispatches CLEAR_PLANNING_LIST for PLANNING view', () => {
            redux.dispatch({type: MAIN.ACTIONS.FILTER, payload: PLANNING_VIEW.PLANNING});
            const priorCount = redux.dispatch.callCount;

            planningApi.ui.list.clearList();

            const newDispatches = redux.dispatch.args.slice(priorCount).map((a) => a[0]);

            expect(newDispatches.some((action) => (
                action.type === PLANNING.ACTIONS.CLEAR_LIST
            ))).toBe(true);
        });
    });

    describe('changeCalendarId', () => {
        it('dispatches SELECT_CALENDAR with the given id', () => {
            const calendarId = 'test-calendar-qcode';

            planningApi.ui.list.changeCalendarId(calendarId);

            expect(redux.dispatch.args.some((args) => (
                args[0]?.type === EVENTS.ACTIONS.SELECT_CALENDAR &&
                args[0]?.payload === calendarId
            ))).toBe(true);
        });

        it('sets the calendar URL param', () => {
            const calendarId = 'test-calendar-qcode';

            planningApi.ui.list.changeCalendarId(calendarId);

            expect(superdeskApi.browser.location.urlParams.setString.args.some((args) => (
                args[0] === 'calendar' && args[1] === calendarId
            ))).toBe(true);
        });

        it('clears the eventsPlanningFilter URL param', () => {
            planningApi.ui.list.changeCalendarId('any-calendar-id');

            expect(superdeskApi.browser.location.urlParams.setString.args.some((args) => (
                args[0] === 'eventsPlanningFilter' && args[1] === null
            ))).toBe(true);
        });
    });

    describe('changeAgendaId', () => {
        it('dispatches SELECT_AGENDA with the given id', () => {
            const agendaId = 'test-agenda-id';

            planningApi.ui.list.changeAgendaId(agendaId);

            expect(redux.dispatch.args.some((args) => (
                args[0]?.type === AGENDA.ACTIONS.SELECT_AGENDA &&
                args[0]?.payload === agendaId
            ))).toBe(true);
        });

        it('sets the agenda URL param', () => {
            const agendaId = 'test-agenda-id';

            planningApi.ui.list.changeAgendaId(agendaId);

            expect(superdeskApi.browser.location.urlParams.setString.args.some((args) => (
                args[0] === 'agenda' && args[1] === agendaId
            ))).toBe(true);
        });

        it('clears the eventsPlanningFilter URL param', () => {
            planningApi.ui.list.changeAgendaId('any-agenda-id');

            expect(superdeskApi.browser.location.urlParams.setString.args.some((args) => (
                args[0] === 'eventsPlanningFilter' && args[1] === null
            ))).toBe(true);
        });
    });

    describe('changeCurrentView', () => {
        it('dispatches the FILTER action with the new view', () => {
            planningApi.ui.list.changeCurrentView(PLANNING_VIEW.PLANNING);

            expect(redux.dispatch.args.some((args) => (
                args[0]?.type === MAIN.ACTIONS.FILTER &&
                args[0]?.payload === PLANNING_VIEW.PLANNING
            ))).toBe(true);
        });

        it('sets the filter URL param', () => {
            planningApi.ui.list.changeCurrentView(PLANNING_VIEW.EVENTS);

            expect(superdeskApi.browser.location.urlParams.setString.args.some((args) => (
                args[0] === 'filter' && args[1] === PLANNING_VIEW.EVENTS
            ))).toBe(true);
        });
    });

    describe('changeFilterId', () => {
        it('dispatches SELECT_EVENT_FILTER for EVENTS view', () => {
            redux.dispatch({type: MAIN.ACTIONS.FILTER, payload: PLANNING_VIEW.EVENTS});
            const filterId = 'filter-id-events';

            planningApi.ui.list.changeFilterId(filterId);

            expect(redux.dispatch.args.some((args) => (
                args[0]?.type === EVENTS.ACTIONS.SELECT_FILTER &&
                args[0]?.payload === filterId
            ))).toBe(true);
        });

        it('clears the calendar URL param for EVENTS view', () => {
            redux.dispatch({type: MAIN.ACTIONS.FILTER, payload: PLANNING_VIEW.EVENTS});

            planningApi.ui.list.changeFilterId('some-filter-id');

            expect(superdeskApi.browser.location.urlParams.setString.args.some((args) => (
                args[0] === 'calendar' && args[1] === null
            ))).toBe(true);
        });

        it('dispatches SELECT_AGENDA_FILTER for PLANNING view', () => {
            redux.dispatch({type: MAIN.ACTIONS.FILTER, payload: PLANNING_VIEW.PLANNING});
            const filterId = 'filter-id-planning';

            planningApi.ui.list.changeFilterId(filterId);

            expect(redux.dispatch.args.some((args) => (
                args[0]?.type === AGENDA.ACTIONS.SELECT_FILTER &&
                args[0]?.payload === filterId
            ))).toBe(true);
        });

        it('clears the agenda URL param for PLANNING view', () => {
            redux.dispatch({type: MAIN.ACTIONS.FILTER, payload: PLANNING_VIEW.PLANNING});

            planningApi.ui.list.changeFilterId('some-filter-id');

            expect(superdeskApi.browser.location.urlParams.setString.args.some((args) => (
                args[0] === 'agenda' && args[1] === null
            ))).toBe(true);
        });

        it('dispatches SELECT_EVENTS_PLANNING_FILTER for COMBINED view', () => {
            // Default state is COMBINED view
            const filterId = 'filter-id-combined';

            planningApi.ui.list.changeFilterId(filterId);

            expect(redux.dispatch.args.some((args) => (
                args[0]?.type === EVENTS_PLANNING.ACTIONS.SELECT_EVENTS_PLANNING_FILTER &&
                args[0]?.payload === filterId
            ))).toBe(true);
        });

        it('sets the eventsPlanningFilter URL param for all views', () => {
            const filterId = 'filter-id-url';

            planningApi.ui.list.changeFilterId(filterId);

            expect(superdeskApi.browser.location.urlParams.setString.args.some((args) => (
                args[0] === 'eventsPlanningFilter' && args[1] === filterId
            ))).toBe(true);
        });
    });

    describe('setViewType', () => {
        it('resolves immediately without dispatching when view type is already set', (done) => {
            // Default listViewType is SCHEDULE (state.main.listViewType is undefined → defaults to SCHEDULE)
            const initialDispatchCount = redux.dispatch.callCount;

            planningApi.ui.list.setViewType(LIST_VIEW_TYPE.SCHEDULE)
                .then((result) => {
                    expect(result).toBeUndefined();
                    expect(redux.dispatch.callCount).toBe(initialDispatchCount);
                    done();
                })
                .catch(done.fail);
        });

        it('dispatches SET_LIST_VIEW_TYPE when switching to a different view type', () => {
            planningApi.ui.list.setViewType(LIST_VIEW_TYPE.LIST);

            expect(redux.dispatch.args.some((args) => (
                args[0]?.type === MAIN.ACTIONS.SET_LIST_VIEW_TYPE &&
                args[0]?.payload === LIST_VIEW_TYPE.LIST
            ))).toBe(true);
        });

        it('sets the listViewType URL param when switching view type', () => {
            planningApi.ui.list.setViewType(LIST_VIEW_TYPE.LIST);

            expect(superdeskApi.browser.location.urlParams.setString.args.some((args) => (
                args[0] === 'listViewType' && args[1] === LIST_VIEW_TYPE.LIST
            ))).toBe(true);
        });
    });

    describe('clearSearch', () => {
        it('dispatches CLEAR_SEARCH with the active filter', () => {
            // Default state is COMBINED view
            planningApi.ui.list.clearSearch();

            expect(redux.dispatch.args.some((args) => (
                args[0]?.type === MAIN.ACTIONS.CLEAR_SEARCH &&
                args[0]?.payload === PLANNING_VIEW.COMBINED
            ))).toBe(true);
        });

        it('dispatches CLEAR_SEARCH with EVENTS when on EVENTS view', () => {
            redux.dispatch({type: MAIN.ACTIONS.FILTER, payload: PLANNING_VIEW.EVENTS});

            planningApi.ui.list.clearSearch();

            expect(redux.dispatch.args.some((args) => (
                args[0]?.type === MAIN.ACTIONS.CLEAR_SEARCH &&
                args[0]?.payload === PLANNING_VIEW.EVENTS
            ))).toBe(true);
        });
    });

    describe('loadNextPage', () => {
        it('calls the search API for the next page when more items are available', (done) => {
            // With default state (COMBINED view), listTotal > searchTotal so fetch is triggered
            planningApi.ui.list.updateSearchAndReloadList()
                .then(() => planningApi.ui.list.loadNextPage())
                .then(() => {
                    expect(planningApi.combined.search.callCount).toBe(2);
                    done();
                })
                .catch(done.fail);
        });

        it('dispatches NEXT_PAGE_LOADED after a successful page fetch', (done) => {
            planningApi.ui.list.updateSearchAndReloadList()
                .then(() => planningApi.ui.list.loadNextPage())
                .then(() => {
                    expect(redux.dispatch.args.some((args) => (
                        args[0]?.type === MAIN.ACTIONS.NEXT_PAGE_LOADED
                    ))).toBe(true);
                    done();
                })
                .catch(done.fail);
        });

        it('notifies the user on fetch failure', (done) => {
            restoreSinonStub(planningApi.combined.search);
            sinon.stub(planningApi.combined, 'search').callsFake(() => Promise.reject(new Error('Network error')));

            const errorCallsBefore = superdeskApi.ui.notify.error.callCount;

            planningApi.ui.list.updateSearchAndReloadList()
                .then(() => planningApi.ui.list.loadNextPage())
                .then((result) => {
                    expect(result).toBeNull();
                    expect(superdeskApi.ui.notify.error.callCount).toBe(errorCallsBefore + 1);
                    done();
                })
                .catch(done.fail);
        });
    });
});
