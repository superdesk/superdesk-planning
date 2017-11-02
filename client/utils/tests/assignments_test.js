import * as utils from '../index'
import { PRIVILEGES } from '../../constants'

describe('can edit assignment', () => {
    const privileges = {
        [PRIVILEGES.PLANNING_MANAGEMENT]: 1,
        [PRIVILEGES.ARCHIVE]: 1,
    }

    const session = {}

    it('assignment state `assigned` - edit assignment', () => {
        expect(
            utils.assignmentUtils.canEditAssignment({ assigned_to: { state: 'assigned' } },
                session, privileges)
        ).toBe(true)
    })

    it('assignment state `submitted`', () => {
        expect(
            utils.assignmentUtils.canEditAssignment({ assigned_to: { state: 'submitted' } },
                session, privileges)
        ).toBe(true)

        expect(
            utils.assignmentUtils.canStartWorking({ assigned_to: { state: 'submitted' } },
                privileges)).toBe(false)
    })

    it('assignment state `cancelled`', () => {
        expect(
            utils.assignmentUtils.canEditAssignment({ assigned_to: { state: 'canceled' } },
                session, privileges)
        ).toBe(false)

        expect(
            utils.assignmentUtils.canStartWorking({ assigned_to: { state: 'canceled' } },
                privileges)).toBe(false)
    })
})
