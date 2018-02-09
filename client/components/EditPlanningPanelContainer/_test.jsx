import React from 'react';
import {shallow, mount, ReactWrapper} from 'enzyme';
import {EditPlanningPanelContainer, EditPlanningPanel} from './index';
import {ModalsContainer} from '../index';
import {createTestStore} from '../../utils';
import {Provider} from 'react-redux';
import * as actions from '../../actions';
import sinon from 'sinon';
import moment from 'moment';
import {restoreSinonStub, getTestActionStore} from '../../utils/testUtils';
import planningApi from '../../actions/planning/api';
import {PLANNING} from '../../constants';

xdescribe('planning', () => {
    describe('containers', () => {
        describe('<EditPlanningPanelContainer />', () => {
            let store;
            let astore;
            let data;
            let initialState;

            beforeEach(() => {
                astore = getTestActionStore();
                data = astore.data;
                initialState = astore.initialState;

                sinon.stub(planningApi, 'lock').callsFake(
                    (item) => (() => (Promise.resolve(item)))
                );
                sinon.stub(planningApi, 'unlock').callsFake(
                    (item) => (() => (Promise.resolve(item)))
                );
            });

            afterEach(() => {
                restoreSinonStub(planningApi.lock);
                restoreSinonStub(planningApi.unlock);
            });

            const setStore = () => {
                astore.init();
                store = createTestStore({initialState});
            };

            const getWrapper = () => {
                setStore();
                return mount(
                    <Provider store={store}>
                        <div>
                            <ModalsContainer />
                            <EditPlanningPanelContainer />
                        </div>
                    </Provider>
                );
            };

            const getShallowWrapper = (planning, event = null) => {
                setStore();
                return shallow(
                    <EditPlanningPanel
                        planning={planning}
                        event={event}
                        users={[]}
                        closePlanningEditor={sinon.spy()}
                        pristine={false}
                        onDuplicate={sinon.spy()}
                        onSpike={sinon.spy()}
                        onUnspike={sinon.spy()}
                        onCancelEvent={sinon.spy()}
                        onUpdateEventTime={sinon.spy()}
                        onConvertToRecurringEvent={sinon.spy()}
                        openPlanningEditor={sinon.spy()}
                        onRescheduleEvent={sinon.spy()}
                        onPostponeEvent={sinon.spy()}
                        onCancelPlanning={sinon.spy()}
                        onCancelAllCoverage={sinon.spy()}
                        privileges={initialState.privileges}
                        lockedItems={{
                            events: {},
                            planning: {
                                p1: {
                                    user: 'ident1',
                                    session: 'session1',
                                    action: 'edit',
                                },
                            },
                            recurring: {},
                        }}
                        submitting={false}
                        openCancelModal={sinon.spy()}
                    />
                );
            };

            it('open the panel for read only preview', () => {
                const wrapper = getWrapper();

                store.dispatch(actions.planning.ui.preview(data.plannings[0]._id));
                expect(store.getState().planning.editorOpened).toBe(true);
                expect(store.getState().planning.readOnly).toBe(true);
                wrapper.find('.EditPlanningPanel__actions__edit').last()
                    .simulate('click');
                expect(store.getState().planning.editorOpened).toBe(false);
            });

            it('open the panel in edit mode', () => {
                const wrapper = getWrapper();

                store.dispatch({
                    type: 'LOCK_PLANNING',
                    payload: {
                        plan: {
                            ...data.plannings[0],
                            lock_action: 'edit',
                            lock_user: 'ident1',
                            lock_session: 'session1',
                            lock_time: moment(),
                        },
                    },
                });

                store.dispatch({
                    type: 'OPEN_PLANNING_EDITOR',
                    payload: data.plannings[0],
                });

                expect(store.getState().planning.editorOpened).toBe(true);
                expect(store.getState().planning.readOnly).toBe(false);
                wrapper.find('button[type="reset"]').first()
                    .simulate('click');
                expect(store.getState().planning.editorOpened).toBe(false);
            });

            xit('cancel', () => {
                const wrapper = getWrapper();

                store.dispatch({
                    type: 'LOCK_PLANNING',
                    payload: {
                        plan: {
                            ...data.plannings[0],
                            lock_action: 'edit',
                            lock_user: 'ident1',
                            lock_session: 'session1',
                            lock_time: moment(),
                        },
                    },
                });

                store.dispatch({
                    type: 'OPEN_PLANNING_EDITOR',
                    payload: data.plannings[0],
                });

                const saveButton = wrapper.find('button[type="submit"]').first();
                const cancelButton = wrapper.find('button[type="reset"]').first();

                expect(saveButton.props().disabled).toBe(true);
                expect(cancelButton.props().disabled).toBe(false);

                const sluglineInput = wrapper.find('Field [name="slugline"]');

                // Modify the slugline and ensure the save/cancel buttons are active
                expect(sluglineInput.props().value).toBe('Planning1');
                sluglineInput.simulate('change', {target: {value: 'NewSlug'}});
                expect(sluglineInput.props().value).toBe('NewSlug');

                // const saveButton = wrapper.find('button[type="submit"]').first()
                // const cancelButton = wrapper.find('button[type="reset"]').first()
                expect(saveButton.props().disabled).toBe(false);
                expect(cancelButton.props().disabled).toBe(false);

                // Cancel the modifications and ensure the save & cancel button disappear once again
                cancelButton.simulate('click');

                const confirmationModal = wrapper.find('ConfirmationModal');
                const dialog = wrapper.find('Portal');
                const modal = new ReactWrapper(<Provider store={store}>{dialog.node.props.children}</Provider>);

                expect(confirmationModal.length).toBe(1);
                modal.find('button[type="reset"]').simulate('click');

                // Simulate an Unlock on the Planning item, as the autosave is deleted on Unlock
                // Without this unlock, the following preview will re-apply the autosave data
                store.dispatch({
                    type: PLANNING.ACTIONS.UNLOCK_PLANNING,
                    payload: {plan: data.plannings[0]},
                });

                expect(store.getState().planning.editorOpened).toBe(false);
                store.dispatch(actions.planning.ui.preview(data.plannings[0]._id));
                expect(sluglineInput.props().value).toBe('Planning1');
                expect(wrapper.find('button[type="submit"]').length).toBe(0);
                expect(wrapper.find('button[type="reset"]').length).toBe(0);
            });

            it('displays the `planning spiked` badge', () => {
                data.plannings[0].state = 'spiked';
                const wrapper = getShallowWrapper(data.plannings[0]);

                const badge = wrapper.find('.PlanningSpiked').first();
                const saveButton = wrapper.find('button[type="submit"]');

                // Make sure the `save` button is not shown
                expect(saveButton.length).toBe(0);

                // Make sure the `planning spiked` badge is shown
                expect(badge.text()).toBe('planning spiked');
            });

            it('displays the `event spiked` badge', () => {
                data.events[0].state = 'spiked';
                const wrapper = getShallowWrapper(data.plannings[0], data.events[0]);

                const badge = wrapper.find('.EventSpiked').first();
                const saveButton = wrapper.find('button[type="submit"]');

                // Make sure the `save` button is not shown
                expect(saveButton.length).toBe(0);

                // Make sure the `event spiked` badge is shown
                expect(badge.text()).toBe('event spiked');
            });
        });
    });
});
