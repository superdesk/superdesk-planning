import sinon from 'sinon'
import * as actions from '../../actions'

describe('<CreateAgendaComponent />', () => {

    it('display error _message', () => {
        const getState = () => ({ planning: { agendas: [] } })
        const dispatch = sinon.spy(() => (Promise.resolve()))
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
        const action = actions.createAgenda({ name: 'foo' })
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
        const getState = () => ({ planning: { agendas: [] } })
        const dispatch = sinon.spy(() => (Promise.resolve()))
        const data = { data: { _issues: { 'validator exception': 'foo bar exception' } } }
        const api = () => ({ save: sinon.stub().returns(Promise.reject(data)) })
        const notify = {
            error: sinon.spy((message) => {
                expect(message).toBe('foo bar exception')
            }),
            success: sinon.spy(),
        }
        const action = actions.createAgenda({ name: 'foo' })
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
        const getState = () => ({ planning: { agendas: [] } })
        const dispatch = sinon.spy(() => (Promise.resolve()))
        const api = () => ({ save: sinon.stub().returns(Promise.reject()) })
        const notify = {
            error: sinon.spy((message) => {
                expect(message).toBe('There was a problem, Agenda not created/updated.')
            }),
            success: sinon.spy(),
        }
        const action = actions.createAgenda({ name: 'foo' })
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
