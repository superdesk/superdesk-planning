import React from 'react'
import { shallow, mount, ReactWrapper } from 'enzyme'
import { EditPlanningPanelContainer, EditPlanningPanel } from './index'
import { ModalsContainer } from '../index'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import * as actions from '../../actions'
import sinon from 'sinon'
import moment from 'moment'
import { restoreSinonStub } from '../../utils/testUtils'
import planningApi from '../../actions/planning/api'
import planningUi from '../../actions/planning/ui'

describe('planning', () => {

    describe('containers', () => {

        describe('<EditPlanningPanelContainer />', () => {
            const privileges = {
                planning: 1,
                planning_planning_management: 1,
                planning_planning_spike: 1,
                planning_planning_unspike: 1,
            }

            beforeEach(() => {
                sinon.stub(planningApi, 'lock').callsFake((item) => (() => (Promise.resolve(item))))
            })

            afterEach(() => {
                restoreSinonStub(planningApi.lock)
            })

            it('open the panel for read only preview', () => {
                let store = createTestStore({
                    initialState: {
                        privileges,
                        session: {
                            identity: { _id: 'user' },
                            sessionId: 123,
                        },
                        users: [
                            {
                                _id: 'user',
                                display_name: 'foo',
                            },
                        ],
                        locks: {
                            events: {},
                            planning: {},
                            recurring: {},
                        },
                    },
                })
                const wrapper = mount(
                    <Provider store={store}>
                        <EditPlanningPanelContainer />
                    </Provider>
                )
                store.dispatch(actions.planning.ui.preview())
                expect(store.getState().planning.editorOpened).toBe(true)
                expect(store.getState().planning.readOnly).toBe(true)
                wrapper.find('.EditPlanningPanel__actions__edit').last().simulate('click')
                expect(store.getState().planning.editorOpened).toBe(false)
            })

            it('open the panel in edit mode', (done) => {
                const planning1 = {
                    _id: 'planning1',
                    lock_user: 'user',
                    lock_session: 123,
                }

                const store = createTestStore({
                    initialState: {
                        privileges,
                        planning: {
                            plannings: { planning1 },
                            editorOpened: true,
                            currentPlanningId: 'planning1',
                            readOnly: false,
                        },
                        session: {
                            identity: { _id: 'user' },
                            sessionId: 123,
                        },
                        users: [
                            {
                                _id: 'user',
                                display_name: 'foo',
                            },
                        ],
                        locks: {
                            events: {},
                            planning: {},
                            recurring: {},
                        },
                    },
                })

                const wrapper = mount(
                    <Provider store={store}>
                        <EditPlanningPanelContainer />
                    </Provider>
                )

                store.dispatch(planningUi.openEditor(planning1))
                .then(() => {
                    expect(store.getState().planning.editorOpened).toBe(true)
                    expect(store.getState().planning.readOnly).toBe(false)
                    wrapper.find('button[type="reset"]').first().simulate('click')
                    expect(store.getState().planning.editorOpened).toBe(false)

                    done()
                })

            })

            it('cancel', () => {
                const store = createTestStore({
                    initialState: {
                        privileges,
                        planning: {
                            plannings: {
                                planning1: {
                                    _id: 'planning1',
                                    slugline: 'slug',
                                    coverages: [{ _id: 'coverage1' }],
                                    lock_user: 'user',
                                    lock_session: 123,
                                },
                            },
                            editorOpened: true,
                            currentPlanningId: 'planning1',
                            readOnly: false,
                        },
                        session: {
                            identity: { _id: 'user' },
                            sessionId: 123,
                        },
                        users: [{ _id: 'user' }],
                        desks: [],
                        formsProfile: { planning: { editor: { slugline: { enabled: true } } } },
                        locks: {
                            events: {},
                            planning: {},
                            recurring: {},
                        },
                        workspace: {
                            currentDeskId: null,
                            currentStageId: null,
                            currentWorkspace: 'PLANNING',
                        },
                    },
                })
                const wrapper = mount(
                    <Provider store={store}>
                        <div>
                            <ModalsContainer />
                            <EditPlanningPanelContainer />
                        </div>
                    </Provider>
                )

                const sluglineInput = wrapper.find('Field [name="slugline"]')

                // Modify the slugline and ensure the save/cancel buttons are active
                expect(sluglineInput.props().value).toBe('slug')
                sluglineInput.simulate('change', { target: { value: 'NewSlug' } })
                expect(sluglineInput.props().value).toBe('NewSlug')

                const saveButton = wrapper.find('button[type="submit"]').first()
                const cancelButton = wrapper.find('button[type="reset"]').first()
                expect(saveButton.props().disabled).toBe(false)
                expect(cancelButton.props().disabled).toBe(false)

                // Cancel the modifications and ensure the save & cancel button disappear once again
                cancelButton.simulate('click')

                const confirmationModal = wrapper.find('ConfirmationModal')
                const dialog = wrapper.find('Portal')
                const modal = new ReactWrapper(<Provider store={store}>{dialog.node.props.children}</Provider>)
                expect(confirmationModal.length).toBe(1)
                modal.find('button[type="reset"]').simulate('click')

                expect(store.getState().planning.editorOpened).toBe(false)
                store.dispatch(actions.planning.ui.preview('planning1'))
                expect(sluglineInput.props().value).toBe('slug')
                expect(wrapper.find('button[type="submit"]').length).toBe(0)
                expect(wrapper.find('button[type="reset"]').length).toBe(0)
            })

            it('displays the `planning spiked` badge', () => {
                const planning = {
                    slugline: 'Plan1',
                    state: 'spiked',
                }
                const wrapper = shallow(
                    <EditPlanningPanel
                        planning={planning}
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
                        privileges={privileges}
                        lockedItems={{
                            events: {},
                            planning: {},
                            recurring: {},
                        }}
                        submitting={false}
                    />
                )

                const badge = wrapper.find('.PlanningSpiked').first()
                const saveButton = wrapper.find('button[type="submit"]')

                // Make sure the `save` button is not shown
                expect(saveButton.length).toBe(0)

                // Make sure the `planning spiked` badge is shown
                expect(badge.text()).toBe('planning spiked')
            })

            it('displays the `event spiked` badge', () => {
                const event = {
                    name: 'Event 1',
                    state: 'spiked',
                    dates: {
                        start: moment('2016-10-15T13:01:00+0000'),
                        end: moment('2016-10-15T14:01:00+0000'),
                    },
                }
                const wrapper = shallow(
                    <EditPlanningPanel
                        planning={{}}
                        event={event}
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
                        privileges={privileges}
                        lockedItems={{
                            events: {},
                            planning: {},
                            recurring: {},
                        }}
                        submitting={false}
                    />
                )

                const badge = wrapper.find('.EventSpiked').first()
                const saveButton = wrapper.find('button[type="submit"]')

                // Make sure the `save` button is not shown
                expect(saveButton.length).toBe(0)

                // Make sure the `event spiked` badge is shown
                expect(badge.text()).toBe('event spiked')
            })
        })
    })
})
