import * as selectors from '../index';
import moment from 'moment';
import {MAIN, SPIKED_STATE} from '../../constants';
import {planningConfig} from '../../config';
import {PLANNING_VIEW} from '../../interfaces';

describe('main selectors', () => {
    let state;

    beforeEach(() => {
        state = {
            main: {
                search: {
                    [MAIN.FILTERS.EVENTS]: {currentSearch: {spikeState: SPIKED_STATE.NOT_SPIKED}, fulltext: ''},
                    [MAIN.FILTERS.COMBINED]: {currentSearch: {spikeState: SPIKED_STATE.NOT_SPIKED}, fulltext: ''},
                    [MAIN.FILTERS.PLANNING]: {currentSearch: {spikeState: SPIKED_STATE.NOT_SPIKED}, fulltext: ''},
                },
            },
            privileges: {
                planning_event_management: 1,
                planning_planning_management: 1,
            },
        };
    });

    describe('is view filtered', () => {
        it('if default search then view is not filtered', () => {
            state.main.filter = MAIN.FILTERS.EVENTS;
            expect(selectors.main.isViewFiltered(state)).toBe(false);
        });

        it('if spike state is set', () => {
            state.main.filter = MAIN.FILTERS.EVENTS;
            state.main.search.EVENTS.currentSearch.spikeState = SPIKED_STATE.BOTH;
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });

        it('if fulltext is set for events', () => {
            state.main.filter = MAIN.FILTERS.EVENTS;
            state.main.search.EVENTS.currentSearch.fulltext = 'test';
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });

        it('if fulltext is set for planning', () => {
            state.main.filter = MAIN.FILTERS.PLANNING;
            state.main.search.PLANNING.currentSearch.fulltext = '';
            expect(selectors.main.isViewFiltered(state)).toBe(false);
        });

        it('if fulltext is set for combined', () => {
            state.main.filter = MAIN.FILTERS.COMBINED;
            state.main.search.COMBINED.currentSearch.fulltext = 'test';
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });

        it('if slugline is set for events', () => {
            state.main.filter = MAIN.FILTERS.EVENTS;
            state.main.search.EVENTS.currentSearch.advancedSearch = {slugline: 'test'};
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });

        it('if slugline is set planning', () => {
            state.main.filter = MAIN.FILTERS.PLANNING;
            state.main.search.PLANNING.currentSearch.advancedSearch = {slugline: ''};
            expect(selectors.main.isViewFiltered(state)).toBe(false);
        });

        it('if slugline is set combined', () => {
            state.main.filter = MAIN.FILTERS.COMBINED;
            state.main.search.COMBINED.currentSearch.advancedSearch = {slugline: 'test'};
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });

        it('if dates is set for events', () => {
            state.main.filter = MAIN.FILTERS.EVENTS;
            state.main.search.EVENTS.currentSearch.advancedSearch = {dates: {start: moment()}};
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });

        it('if dates is set for planning', () => {
            state.main.filter = MAIN.FILTERS.PLANNING;
            state.main.search.PLANNING.currentSearch.advancedSearch = {dates: {end: moment()}};
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });

        it('if dates is set for combined', () => {
            state.main.filter = MAIN.FILTERS.COMBINED;
            state.main.search.COMBINED.currentSearch.advancedSearch = {dates: {range: 'test'}};
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });

        it('if no coverage set to false', () => {
            state.main.filter = MAIN.FILTERS.PLANNING;
            state.main.search.PLANNING.currentSearch.advancedSearch = {noCoverage: false};
            expect(selectors.main.isViewFiltered(state)).toBe(false);
        });

        it('if no coverage set to true', () => {
            state.main.filter = MAIN.FILTERS.PLANNING;
            state.main.search.PLANNING.currentSearch.advancedSearch = {noCoverage: true};
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });
    });

    describe('activeFilter', () => {
        afterEach(() => {
            planningConfig.planning_default_view = PLANNING_VIEW.COMBINED;
        });

        it('reads default from app config', () => {
            planningConfig.planning_default_view = PLANNING_VIEW.PLANNING;
            expect(selectors.main.activeFilter(state)).toBe(PLANNING_VIEW.PLANNING);

            planningConfig.planning_default_view = PLANNING_VIEW.EVENTS;
            expect(selectors.main.activeFilter(state)).toBe(PLANNING_VIEW.EVENTS);
        });
    });
});
