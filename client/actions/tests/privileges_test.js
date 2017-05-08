import sinon from 'sinon'
import * as actions from '../privileges'

describe('privileges', () => {
    describe('actions', () => {
        const privileges = {
            loaded: Promise.resolve(),
            privileges: {
                planning: 1,
                planning_agenda_management: 1,
            },
        }

        const dispatch = sinon.spy(() => (Promise.resolve()))

        it('loadPrivileges', () => {
            const action = actions.loadPrivileges()
            return action(dispatch, null, { privileges })
            .then(() => {
                expect(dispatch.args[0]).toEqual([{
                    type: 'RECEIVE_PRIVILEGES',
                    payload: privileges.privileges,
                }])
            })
        })

    })
})
