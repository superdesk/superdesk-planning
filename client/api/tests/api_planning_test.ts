import sinon from 'sinon';
import {Store} from 'redux';
import {cloneDeep} from 'lodash';

import {superdeskApi, planningApi} from '../../superdeskApi';
import * as selectors from '../../selectors';

import * as testDataOriginal from '../../utils/testData';
import {restoreSinonStub} from '../../utils/testUtils';
import {createTestStore} from '../../utils';

describe('planningApi.planning', () => {
    let redux: Store;

    beforeEach(() => {
        redux = createTestStore();
        planningApi.redux.store = redux;
    });

    describe('addCoverageToWorkflow', () => {
        afterEach(() => {
            restoreSinonStub(planningApi.planning.update);
        });

        it('updates the planning item and notifies end user', (done) => {
            const original = cloneDeep(testDataOriginal.plannings[0]);
            const coverage = original.coverages[0];

            sinon.stub(planningApi.planning, 'update').callsFake((original, updates) => Promise.resolve({
                ...original,
                ...updates,
            }));
            planningApi.planning.coverages.addCoverageToWorkflow(original, coverage, 0)
                .then((updatedPlanning) => {
                    expect(updatedPlanning.coverages[0].workflow_status).toBe('active');
                    expect(updatedPlanning.coverages[0].assigned_to.state).toBe('assigned');

                    expect(superdeskApi.ui.notify.success.callCount).toBe(1);
                    expect(superdeskApi.ui.notify.success.args[0]).toEqual(['Coverage added to workflow.']);

                    const store = planningApi.redux.store.getState();
                    const plannings = selectors.planning.storedPlannings(store);

                    expect(plannings[original._id].coverages[0].workflow_status).toBe('active');
                    expect(plannings[original._id].coverages[0].assigned_to.state).toBe('assigned');

                    done();
                })
                .catch(done.fail);
        });

        it('notified the user on failure', (done) => {
            const original = cloneDeep(testDataOriginal.plannings[0]);
            const coverage = original.coverages[0];

            sinon.stub(planningApi.planning, 'update').callsFake(() => Promise.reject('Failed request'));
            planningApi.planning.coverages.addCoverageToWorkflow(original, coverage, 0)
                .then(
                    done.fail,
                    (error) => {
                        expect(error).toBe('Failed request');
                        expect(superdeskApi.ui.notify.error.callCount).toBe(1);
                        expect(superdeskApi.ui.notify.error.args[0]).toEqual(['Failed request']);

                        done();
                    }
                )
                .catch(done.fail);
        });
    });
});
