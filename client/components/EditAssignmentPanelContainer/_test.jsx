import React from 'react'
import { createTestStore } from '../../utils'
import { ASSIGNMENTS } from '../../constants'
import { mount } from 'enzyme'
import { EditAssignmentPanelContainer } from './index'
import { Provider } from 'react-redux'
import sinon from 'sinon'
import moment from 'moment'
import { restoreSinonStub, itemActionExists } from '../../utils/testUtils'
import assignmentsUi from '../../actions/assignments/ui'
import { WORKSPACE } from '../../constants/workspace'


describe('<EditAssignmentPanelContainer />', () => {
    let onFulFilAssignment = sinon.spy()

    const getWrapper = (store) => {
        return mount(<Provider store={store}>
            <EditAssignmentPanelContainer onFulFilAssignment={onFulFilAssignment} />
            </Provider>
        )
    }

    const getState = (workspace=WORKSPACE.ASSIGNMENTS) => (
        {
            assignment: {
                assignments: {
                    1: {
                        _id: 1,
                        _created: '2017-07-13T13:55:41+0000',
                        _updated: '2017-07-28T11:16:36+0000',
                        planning: {
                            scheduled: moment('2017-07-28T11:16:36+0000'),
                            slugline: 'slugline',
                            headline: 'headline',
                        },
                        assigned_to: {
                            assigned_date: '2017-07-28T11:16:36+0000',
                            desk: 123,
                            state: 'assigned',
                        },
                        priority: ASSIGNMENTS.DEFAULT_PRIORITY,
                    },
                },
                previewOpened: false,
                currentAssignmentId: null,
                readOnly: true,
                assignmentsInList: [1],
            },
            privileges: {
                archive: 1,
                planning_planning_management: 1,
            },
            workspace: { currentWorkspace: workspace },
            session: {
                identity: { _id: 'ident1' },
                sessionId: 'session1',
            },
            users: [
                {
                    _id: 'ident1',
                    display_name: 'firstname lastname',
                },
                {
                    _id: 'ident2',
                    display_name: 'firstname2 lastname2',
                },
            ],
            vocabularies: {
                assignment_priority: [
                    {
                        name: 'High',
                        qcode: 1,
                    },
                    {
                        name: 'Medium',
                        qcode: 2,
                    },
                    {
                        name: 'Low',
                        qcode: 3,
                    },
                ],
            },
        }
    )

    beforeEach(() => {
        sinon.stub(assignmentsUi, 'save').callsFake(() => (Promise.resolve({})))
    })

    afterEach(() => {
        restoreSinonStub(assignmentsUi.save)
    })

    it('open the preview', () => {
        const initialState = getState()
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(wrapper.find('.TimeAndAuthor').length).toBe(2)
        expect(wrapper.find('.AssignmentForm').length).toBe(1)
        expect(wrapper.find('.icon-close-small').length).toBe(1)
    })

    it('No item actions are assignment is locked by another user', () => {
        const initialState = getState()
        initialState.assignment.assignments[1].lock_user = 'ident2'
        initialState.assignment.assignments[1].lock_session = 'session2'
        initialState.assignment.assignments[1].lock_action = 'edit'
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        expect(wrapper.find('ItemActionsMenu').length).toBe(0)
    })

    it('click on the close closes the editor', () => {
        const initialState = getState()
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        const closeIcon = wrapper.find('.icon-close-small')
        closeIcon.simulate('click')
        expect(store.getState().assignment.previewOpened).toBe(false)
    })

    it('shows locked user avatar if assignment is locked', () => {
        let initialState = getState()
        initialState.assignment.assignments[1].lock_user = 'ident2'
        initialState.assignment.assignments[1].lock_session = 'session2'
        initialState.assignment.assignments[1].lock_action = 'edit'

        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(wrapper.find('.lock-avatar').length).toBe(1)
    })

    it('click on the fulfil assignment', (done) => {
        const initialState = getState(WORKSPACE.AUTHORING)
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(wrapper.find('.icon-close-small').length).toBe(1)
        expect(wrapper.find('button[type="submit"]').length).toBe(1)
        const fulfilButton = wrapper.find('button[type="submit"]').first()
        expect(store.getState().assignment.previewOpened).toBe(true)
        expect(fulfilButton.text()).toBe('Fulfil Assignment')
        fulfilButton.simulate('click')
        expect(onFulFilAssignment.callCount).toBe(1)
        wrapper.find('.icon-close-small').first().simulate('click')
        expect(store.getState().assignment.previewOpened).toBe(false)
        done()
    })

    it('Reassign and Edit Priority action appears for items in_progress, assigned, submitted state', () => {
        const initialState = getState()
        initialState.assignment.assignments[1].assigned_to.state = 'in_progress'
        let store = createTestStore({ initialState })
        let wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(itemActionExists(wrapper, 'Reassign')).toBe(true)
        expect(itemActionExists(wrapper, 'Edit Priority')).toBe(true)

        initialState.assignment.assignments[1].assigned_to.state = 'assigned'
        store = createTestStore({ initialState })
        wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(itemActionExists(wrapper, 'Reassign')).toBe(true)
        expect(itemActionExists(wrapper, 'Edit Priority')).toBe(true)

        initialState.assignment.assignments[1].assigned_to.state = 'submitted'
        store = createTestStore({ initialState })
        wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(itemActionExists(wrapper, 'Reassign')).toBe(true)
        expect(itemActionExists(wrapper, 'Edit Priority')).toBe(true)
    })

    it('Completed or cancelled state has no reassign or edit priority actions', () => {
        let initialState = getState()
        initialState.assignment.assignments[1].assigned_to.state = 'completed'
        let store = createTestStore({ initialState })
        let wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(itemActionExists(wrapper, 'Reassign')).toBe(false)
        expect(itemActionExists(wrapper, 'Edit Priority')).toBe(false)

        initialState.assignment.assignments[1].assigned_to.state = 'cancelled'
        store = createTestStore({ initialState })
        wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(itemActionExists(wrapper, 'Reassign')).toBe(false)
        expect(itemActionExists(wrapper, 'Edit Priority')).toBe(false)
    })

    it('Complete Item action appears for items in_progress state only', () => {
        const initialState = getState()
        initialState.assignment.assignments[1].assigned_to.state = 'in_progress'
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(itemActionExists(wrapper, 'Complete Assignment')).toBe(true)
    })

    it('Complete Item is not available for user without archive privilege', () => {
        const initialState = getState()
        initialState.privileges.archive = 0
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(itemActionExists(wrapper, 'Complete Assignment')).toBe(false)
    })
})