import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import {noop} from 'lodash';

import {GROUP_LIST_BY, SORT_FIELD} from '../../../interfaces';
import {MAIN} from '../../../constants';
import {getTestActionStore} from '../../../utils/testUtils';
import {createTestStore} from '../../../utils';
import {EventItem} from '../EventItem';
import {CoverageIcons} from '../../Coverages/CoverageIcons';

describe('<EventItem />', () => {
    const coverages = [
        {
            coverage_id: 'c1',
            planning: {g2_content_type: 'text', scheduled: '2016-10-15T12:00:00+0000', language: 'fi'},
        },
        {
            coverage_id: 'c2',
            planning: {g2_content_type: 'picture', scheduled: '2016-10-16T12:00:00+0000', language: 'en'},
        },
    ];

    const getWrapper = (props = {}) => {
        const astore = getTestActionStore();

        astore.init();
        const store = createTestStore({initialState: astore.initialState});
        const item = {...astore.initialState.events.events.e1, coverages};

        return mount(
            <Provider store={store}>
                <EventItem
                    item={item}
                    lockedItems={astore.initialState.locks}
                    session={astore.initialState.session}
                    privileges={astore.initialState.privileges}
                    activeFilter={MAIN.FILTERS.EVENTS}
                    multiSelected={false}
                    active={false}
                    groupListBy={GROUP_LIST_BY.DATE}
                    sortField={SORT_FIELD.SCHEDULE}
                    minTimeWidth="100px"
                    onItemClick={noop}
                    onMultiSelectClick={noop}
                    refNode={noop}
                    calendars={[]}
                    relatedPlanningsCount={0}
                    planningProps={{date: '2016-10-15'}}
                    {...props}
                />
            </Provider>
        );
    };

    const renderedCoverageIds = (wrapper) => wrapper.find(CoverageIcons)
        .prop('coverages')
        .map((coverage) => coverage.coverage_id);

    it('shows the coverages scheduled on the day group', () => {
        expect(renderedCoverageIds(getWrapper())).toEqual(['c1']);
        expect(renderedCoverageIds(getWrapper({planningProps: {date: '2016-10-16'}}))).toEqual(['c2']);
    });

    it('filters coverages by the list language filter', () => {
        expect(renderedCoverageIds(getWrapper({filterLanguage: 'en'}))).toEqual([]);
        expect(renderedCoverageIds(getWrapper({filterLanguage: 'en', planningProps: {date: '2016-10-16'}})))
            .toEqual(['c2']);
    });
});
