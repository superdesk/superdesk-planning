import sinon from 'sinon'
import * as actions from '../privileges'
import { PRIVILEGES } from '../../constants'
import { checkPermission } from '../../utils'

describe('privileges', () => {
    describe('actions', () => {
        let privileges
        let initialState
        const dispatch = sinon.spy(() => (Promise.resolve()))
        const getState = () => (initialState)
        const notify = { error: sinon.spy() }
        const $timeout = sinon.spy((func) => func())

        beforeEach(() => {
            privileges = {
                planning: 1,
                planning_agenda_management: 1,
                planning_planning_management: 1,
            }
            initialState = { privileges }
            dispatch.reset()
            notify.error.reset()
            $timeout.reset()
        })

        it('loadPrivileges', () => {
            const privileges = {
                loaded: Promise.resolve(),
                privileges,
            }
            const action = actions.loadPrivileges()
            return action(dispatch, null, { privileges })
            .then(() => {
                expect(dispatch.args[0]).toEqual([{
                    type: PRIVILEGES.ACTIONS.RECEIVE_PRIVILEGES,
                    payload: privileges.privileges,
                }])
            })
        })

        const _mockAction = () => ({ type: 'MOCK' })

        const action = checkPermission(
            _mockAction,
            PRIVILEGES.PLANNING_MANAGEMENT,
            'Unauthorised to perform this action'
        )

        it('checkPermission for ACCESS_DENIED', () => {
            initialState.privileges.planning_planning_management = 0
            action()(dispatch, getState, {
                notify,
                $timeout,
            })
            expect($timeout.callCount).toBe(1)
            expect(notify.error.args[0][0]).toBe('Unauthorised to perform this action')
            expect(dispatch.args[0]).toEqual([{
                type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                payload: {
                    action: '_mockAction',
                    permission: PRIVILEGES.PLANNING_MANAGEMENT,
                    errorMessage: 'Unauthorised to perform this action',
                    args: [],
                },
            }])
            expect(dispatch.callCount).toBe(1)
        })

        it('checkPermission for ACCESS_GRANTED', () => {
            action()(dispatch, getState, {
                notify,
                $timeout,
            })
            expect(dispatch.args[0]).toEqual([{ type: 'MOCK' }])
            expect(dispatch.callCount).toBe(1)
        })
    })
})
