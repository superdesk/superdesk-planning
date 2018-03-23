import * as selectors from '../index';
import moment from 'moment';
import {MAIN, SPIKED_STATE} from '../../constants';

describe('main selectors', () => {
    describe('is view filtered', () => {
        let state;

        beforeEach(() => {
            state = {
                main: {
                    search: {
                        [MAIN.FILTERS.EVENTS]: {currentSearch: {spikeState: SPIKED_STATE.NOT_SPIKED}, fulltext: ''},
                        [MAIN.FILTERS.COMBINED]: {currentSearch: {spikeState: SPIKED_STATE.NOT_SPIKED}, fulltext: ''},
                        [MAIN.FILTERS.PLANNING]: {currentSearch: {spikeState: SPIKED_STATE.NOT_SPIKED}, fulltext: ''}
                    }
                }
            };
        });


        it('if default search then view is not filtered', () => {
            state.main.filter = MAIN.FILTERS.EVENTS;
            expect(selectors.main.isViewFiltered(state)).toBe(false);
        });

        it('if spike state is set', () => {
            state.main.filter = MAIN.FILTERS.EVENTS;
            state.main.search.EVENTS.currentSearch.spikeState = SPIKED_STATE.BOTH;
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });

        it('if fulltext is set event', () => {
            state.main.filter = MAIN.FILTERS.EVENTS;
            state.main.search.EVENTS.fulltext = 'test';
            expect(selectors.main.isViewFiltered(state)).toBe(true);
        });

        it('if fulltext is set event', () => {
            state.main.filter = MAIN.FILTERS.PLANNING;
            state.main.search.PLANNING.fulltext = '';
            expect(selectors.main.isViewFiltered(state)).toBe(false);
        });

        it('if fulltext is set event', () => {
            state.main.filter = MAIN.FILTERS.COMBINED;
            state.main.search.COMBINED.fulltext = 'test';
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
});