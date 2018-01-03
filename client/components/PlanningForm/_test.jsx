import {createTestStore} from '../../utils';
import {getTestActionStore} from '../../utils/testUtils';
import {mount} from 'enzyme';
import {PlanningForm, CoverageContainer} from '../index';
import {CoveragesFieldArray} from '../fields';
import React from 'react';
import {Provider} from 'react-redux';
import * as actions from '../../actions';
import * as selectors from '../../selectors';
import * as helpers from '../tests/helpers';

xdescribe('<PlanningForm />', () => {
    let store;
    let astore;
    let services;
    let data;

    beforeEach(() => {
        astore = getTestActionStore();
        services = astore.services;
        data = astore.data;

        astore.initialState.planning.currentPlanningId = data.plannings[0]._id;
        store = undefined;
    });

    const setStore = () => {
        astore.init();

        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {
                api: services.api,
                notify: services.notify,
            },
        });
    };

    const getWrapper = (readOnly = false) => {
        const wrapper = mount(
            <Provider store={store}>
                <PlanningForm
                    onSubmit={
                        (planning) => store.dispatch(
                            actions.planning.ui.saveAndReloadCurrentAgenda(planning)
                        )
                    }
                    readOnly={readOnly}
                    initialValues={selectors.getCurrentPlanning(store.getState())}
                />
            </Provider>
        );

        const form = wrapper.find('form');
        const coveragesField = wrapper.find(CoveragesFieldArray);

        return {
            wrapper: wrapper,
            form: form,
            coveragesField: coveragesField,
            addCoverageButton: coveragesField.find('.Coverage__add-btn'),
            coverageContainers: () => form.find(CoverageContainer),
        };
    };

    describe('planning form', () => {
        it('shows enabled fields', () => {
            setStore();
            const {form} = getWrapper();

            expect(form.find('Field [name="slugline"]').length).toBe(1);
        });

        it('hides disabled fields', () => {
            setStore();
            store.getState().forms.profiles.planning.editor.slugline.enabled = false;
            const {form} = getWrapper();

            expect(form.find('Field [name="slugline"]').length).toBe(0);
        });
    });

    describe('coverages', () => {
        it('removes a coverage', (done) => {
            setStore();
            const pid = data.plannings[0]._id;

            store.getState().planning.plannings[pid].coverages.forEach((cov) => {
                delete cov.assigned_to;
            });
            const {form, coverageContainers} = getWrapper();

            expect(coverageContainers().length).toBe(3);

            let menu = new helpers.actionMenu(coverageContainers().at(0));

            expect(menu.actionLabels()).toContain('Remove coverage');
            menu.invokeAction('Remove coverage');

            expect(coverageContainers().length).toBe(2);

            menu = new helpers.actionMenu(coverageContainers().at(0));
            expect(menu.actionLabels()).toContain('Remove coverage');
            menu.invokeAction('Remove coverage');

            expect(coverageContainers().length).toBe(1);

            form.simulate('submit');

            setTimeout(() => {
                expect(services.api('planning').save.callCount).toBe(1);

                done();
            }, 500);
        });

        it('cannot remove a coverage if assigned', (done) => {
            setStore();
            const {coverageContainers} = getWrapper();

            expect(coverageContainers().length).toBe(3);

            let menu = new helpers.actionMenu(coverageContainers().at(0));

            expect(menu.actionLabels()).not.toContain('Remove coverage');

            menu = new helpers.actionMenu(coverageContainers().at(1));
            expect(menu.actionLabels()).not.toContain('Remove coverage');

            done();
        });

        it('cannot remove all coverages', () => {
            setStore();
            const pid = data.plannings[0]._id;

            store.getState().planning.plannings[pid].coverages.forEach((cov) => {
                delete cov.assigned_to;
            });
            const {coverageContainers} = getWrapper();

            expect(coverageContainers().length).toBe(3);

            let menu = new helpers.actionMenu(coverageContainers().at(0));

            expect(menu.actionLabels()).toContain('Remove coverage');
            menu.invokeAction('Remove coverage');

            expect(coverageContainers().length).toBe(2);

            menu = new helpers.actionMenu(coverageContainers().at(0));
            expect(menu.actionLabels()).toContain('Remove coverage');
            menu.invokeAction('Remove coverage');

            expect(coverageContainers().length).toBe(1);

            menu = new helpers.actionMenu(coverageContainers().at(0));
            expect(menu.actionLabels()).not.toContain('Remove coverage');
        });

        it('new coverages copies metadata from planning item', () => {
            setStore();
            const {coveragesField, addCoverageButton, coverageContainers} = getWrapper();

            expect(coverageContainers().length).toBe(3);
            addCoverageButton.simulate('click');
            expect(coverageContainers().length).toBe(4);

            const coveragesProps = coveragesField.props();

            expect(coveragesProps.slugline).toBe('Planning1');
            expect(coveragesProps.fields.length).toBe(4);
            expect(coveragesProps.fields.get(3).planning.slugline).toBe('Planning1');
        });
    });
});