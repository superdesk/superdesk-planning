import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';

import {PlanningPreviewContent} from '../PlanningPreviewContent';
import {getTestActionStore} from '../../../utils/testUtils';
import {createTestStore} from '../../../utils';

describe('<PlanningPreviewContent />', () => {
    // p2 has both a coverage and a related event
    const getWrapper = (profileOverrides = {}) => {
        const astore = getTestActionStore();

        astore.init();
        astore.initialState.main.previewId = 'p2';
        astore.initialState.main.previewType = 'planning';
        astore.initialState.forms.profiles.planning = {
            ...astore.initialState.forms.profiles.planning,
            editor: {
                ...astore.initialState.forms.profiles.planning.editor,
                files: {enabled: true},
            },
            ...profileOverrides,
        };

        const store = createTestStore({initialState: astore.initialState});

        return mount(
            <Provider store={store}>
                <PlanningPreviewContent item={astore.initialState.planning.plannings.p2} />
            </Provider>
        );
    };

    const getSectionPositions = (wrapper) => {
        const html = wrapper.html();

        return {
            files: html.indexOf('data-test-id="field-files"'),
            coverages: html.indexOf('Coverages'),
            relatedEvents: html.indexOf('Related Events'),
        };
    };

    it('renders bottom sections in default order: attached files, coverages, related events', () => {
        const positions = getSectionPositions(getWrapper());

        expect(positions.files).toBeGreaterThan(-1);
        expect(positions.coverages).toBeGreaterThan(positions.files);
        expect(positions.relatedEvents).toBeGreaterThan(positions.coverages);
    });

    it('orders bottom sections by the profile group indexes when configured', () => {
        const positions = getSectionPositions(getWrapper({
            groups: {
                coverages: {_id: 'coverages', name: 'Coverages', index: 1},
                associated_event: {_id: 'associated_event', name: 'Associated Event', index: 2},
                attachments: {_id: 'attachments', name: 'Attachments', index: 3},
            },
        }));

        expect(positions.coverages).toBeGreaterThan(-1);
        expect(positions.relatedEvents).toBeGreaterThan(positions.coverages);
        expect(positions.files).toBeGreaterThan(positions.relatedEvents);
    });
});
