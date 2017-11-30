import React from 'react';
import {createTestStore} from '../../utils';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import {EditPlanningPanelContainer, CoverageListItem, Coverage} from '../../components';


describe('<CoverageContainer />', () => {
    const coverage = {
        coverage_id: 'foo',
        planning: {
            slugline: 'slugline',
            headline: 'headline',
            g2_content_type: 'text',
        },
    };

    const store = createTestStore({
        initialState: {
            privileges: {
                planning: 1,
                planning_planning_management: 1,
                planning_planning_spike: 1,
                planning_planning_unspike: 1,
            },
            planning: {
                plannings: {
                    planning1: {
                        _id: 'planning1',
                        slugline: 'slug',
                        coverages: [coverage],
                        lock_user: 'user',
                        lock_session: 123,
                    },
                },
                editorOpened: true,
                currentPlanningId: 'planning1',
                readOnly: false,
            },
            session: {
                identity: {_id: 'user'},
                sessionId: 123,
            },
            users: [{_id: 'user'}],
            desks: [],
            formsProfile: {planning: {editor: {slugline: {enabled: true}}}},
        },
    });

    const getWrapper = () => (
        mount(
            <Provider store={store}>
                <EditPlanningPanelContainer />
            </Provider>
        )
    );

    it(' display coverage list item', () => {
        const wrapper = getWrapper();

        expect(wrapper.find(CoverageListItem).length).toBe(1);
        expect(wrapper.find(Coverage).length).toBe(0);
    });

    it(' toggle coverage form', () => {
        const wrapper = getWrapper();

        expect(wrapper.find(CoverageListItem).length).toBe(1);
        expect(wrapper.find(Coverage).length).toBe(0);
        wrapper.find(CoverageListItem).first()
            .simulate('click');
        expect(wrapper.find(CoverageListItem).length).toBe(0);
        expect(wrapper.find(Coverage).length).toBe(1);
        wrapper.find('.Coverage__item--btn-close').first()
            .simulate('click');
        expect(wrapper.find(CoverageListItem).length).toBe(1);
        expect(wrapper.find(Coverage).length).toBe(0);
    });
});
