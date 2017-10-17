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
    let onFulFillAssignment = sinon.spy()

    const getWrapper = (store) => {
        return mount(<Provider store={store}>
            <EditAssignmentPanelContainer onFulFillAssignment={onFulFillAssignment} />
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

    it('click on the edit icon', () => {
        const initialState = getState()
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))
        expect(wrapper.find('.TimeAndAuthor').length).toBe(2)
        expect(wrapper.find('.AssignmentForm').length).toBe(1)
        expect(wrapper.find('.icon-pencil').length).toBe(1)
        expect(wrapper.find('.icon-close-small').length).toBe(1)
        expect(wrapper.find('.btn--primary').length).toBe(0)
        wrapper.find('.icon-pencil').simulate('click')
        expect(wrapper.find('.icon-pencil').length).toBe(0)
        expect(wrapper.find('.icon-close-small').length).toBe(0)
        expect(wrapper.find('.btn--primary').length).toBe(2)
    })

    it('click on the close', () => {
        const initialState = getState()
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))

        expect(wrapper.find('.icon-pencil').length).toBe(1)
        expect(wrapper.find('.btn--primary').length).toBe(0)
        wrapper.find('.icon-pencil').simulate('click')
        expect(wrapper.find('.icon-pencil').length).toBe(0)
        expect(wrapper.find('.btn--primary').length).toBe(2)
        const saveButton = wrapper.find('button[type="submit"]').first()
        const closeButton = wrapper.find('button[type="reset"]').first()
        expect(saveButton.props().disabled).toBe(true)
        expect(closeButton.props().disabled).toBe(false)
        closeButton.simulate('click')
        expect(store.getState().assignment.previewOpened).toBe(false)
    })

    it('click on the fulfill assignment', (done) => {
        const initialState = getState(WORKSPACE.AUTHORING)
        const store = createTestStore({ initialState })
        const wrapper = getWrapper(store)
        store.dispatch(assignmentsUi.preview(initialState.assignment.assignments[1]))

        expect(wrapper.find('.icon-pencil').length).toBe(0)
        expect(wrapper.find('.icon-close-small').length).toBe(1)
        expect(wrapper.find('button[type="submit"]').length).toBe(1)
        const fulfillButton = wrapper.find('button[type="submit"]').first()
        expect(store.getState().assignment.previewOpened).toBe(true)
        expect(fulfillButton.text()).toBe('Fulfill Assignment')
        fulfillButton.simulate('click')
        expect(onFulFillAssignment.callCount).toBe(1)
        wrapper.find('.icon-close-small').first().simulate('click')
        expect(store.getState().assignment.previewOpened).toBe(false)
        done()
    })
})