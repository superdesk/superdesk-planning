import React from 'react';
import {createTestStore} from '../../utils';
import {mount} from 'enzyme';
import {PlanningHistoryContainer} from '../PlanningHistoryContainer/index';
import {Provider} from 'react-redux';
import sinon from 'sinon';

describe('<PlanningHistoryContainer />', () => {
    const currentPlanningId = '5800d71930627218866f1e80';

    it('should fetch current planning item history when mounted', () => {
        const fetchPlanningHistory = sinon.spy();

        const props = {
            currentPlanningId: currentPlanningId,
            fetchPlanningHistory: fetchPlanningHistory(currentPlanningId),
        };

        let store = createTestStore();
        const wrapper = mount(
            <Provider store={store}>
                <PlanningHistoryContainer {...props} />
            </Provider>
        );

        expect(wrapper).toBeDefined();
        expect(fetchPlanningHistory.calledOnce).toBe(true);
        expect(fetchPlanningHistory.calledWith(currentPlanningId)).toBe(true);
    });
});
