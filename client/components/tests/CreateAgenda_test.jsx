import sinon from 'sinon'
import * as actions from '../../actions'

describe('<CreateEditAgendaComponent />', () => {

    let initialState
    beforeEach(() => {
        initialState = {
            planning: {},
            agenda: { agendas: [] },
            privileges: {
                planning: 1,
                planning_agenda_management: 1,
                planning_planning_management: 1,
            },
        }
    })

    const getState = () => (initialState)
    const dispatch = sinon.spy(() => (Promise.resolve()))

    it('display error _message', () => {
        const data = {
            data: {
                _message: 'foo bar',
                _issues: { name: { unique: 1 } },
            },
        }
        const api = () => ({ save: sinon.stub().returns(Promise.reject(data)) })
        const notify = {
            error: sinon.spy((message) => {
                expect(message).toBe('foo bar')
            }),
            success: sinon.spy(),
        }
        const action = actions.createOrUpdateAgenda({ name: 'foo' })
        action(dispatch, getState, {
            api,
            notify,
        })
        .catch(() => {
            expect(notify.error.callCount).toBe(1)
            expect(notify.success.notCalled).toBe(true)
        })
    })

    it('display error validator exception', () => {
        const data = { data: { _issues: { 'validator exception': 'foo bar exception' } } }
        const api = () => ({ save: sinon.stub().returns(Promise.reject(data)) })
        const notify = {
            error: sinon.spy((message) => {
                expect(message).toBe('foo bar exception')
            }),
            success: sinon.spy(),
        }
        const action = actions.createOrUpdateAgenda({ name: 'foo' })
        action(dispatch, getState, {
            api,
            notify,
        })
        .catch(() => {
            expect(notify.error.callCount).toBe(1)
            expect(notify.success.notCalled).toBe(true)
        })
    })

    it('display error generic exception', () => {
        const api = () => ({ save: sinon.stub().returns(Promise.reject()) })
        const notify = {
            error: sinon.spy((message) => {
                expect(message).toBe('There was a problem, Agenda is not created/updated.')
            }),
            success: sinon.spy(),
        }
        const action = actions.createOrUpdateAgenda({ name: 'foo' })
        action(dispatch, getState, {
            api,
            notify,
        })
        .catch(() => {
            expect(notify.error.callCount).toBe(1)
            expect(notify.success.notCalled).toBe(true)
        })
    })
})
