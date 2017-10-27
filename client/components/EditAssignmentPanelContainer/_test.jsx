import React from 'react'
import { createTestStore } from '../../utils'
import { mount } from 'enzyme'
import { EditAssignmentPanelContainer } from './index'
import { Provider } from 'react-redux'
import sinon from 'sinon'
import moment from 'moment'
import { restoreSinonStub } from '../../utils/testUtils'
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
                    },
                },
                previewOpened: false,
                currentAssignmentId: null,
                readOnly: true,
                assignmentsInList: [1],
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
        expect(wrapper.find('.icon-pencil').length).toBe(1)
        expect(wrapper.find('.icon-close-small').length).toBe(1)
        expect(wrapper.find('.btn--primary').length).toBe(0)
    })

    it('edit icon is visible', () => {
        const initialState = getState()
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(wrapper.find('.icon-pencil').length).toBe(1)
        expect(wrapper.find('.icon-close-small').length).toBe(1)
        expect(wrapper.find('.btn--primary').length).toBe(0)
    })

    it('edit icon not visible if there is workflow state conflict', () => {
        const initialState = getState()
        initialState.assignment.assignments['1'].assigned_to.state = 'completed'
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(wrapper.find('.icon-pencil').length).toBe(0)
        expect(wrapper.find('.icon-close-small').length).toBe(1)
        expect(wrapper.find('.btn--primary').length).toBe(0)
    })

    it('edit icon not visible if assignment is locked', () => {
        const initialState = getState()
        initialState.assignment.assignments['1'].lock_user = 'ident1'
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(wrapper.find('.icon-pencil').length).toBe(0)
        expect(wrapper.find('.icon-close-small').length).toBe(1)
        expect(wrapper.find('.btn--primary').length).toBe(0)
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
        store.dispatch(assignmentsUi._openEditor(initialState.assignment.assignments[1]))
        expect(wrapper.find('.lock-avatar').length).toBe(1)
    })

    it('click on the fulfil assignment', (done) => {
        const initialState = getState(WORKSPACE.AUTHORING)
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))

        expect(wrapper.find('.icon-pencil').length).toBe(0)
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
})