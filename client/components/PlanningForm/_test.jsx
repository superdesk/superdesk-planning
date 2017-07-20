import { createTestStore } from '../../utils'
import { getTestActionStore } from '../../utils/testUtils'
import { mount } from 'enzyme'
import { PlanningForm } from '../index'
import { CoveragesFieldArray } from '../fields'
import React from 'react'
import { Provider } from 'react-redux'
import { get } from 'lodash'

describe('<PlanningForm />', () => {
    let store
    let astore
    let services
    let data

    beforeEach(() => {
        astore = getTestActionStore()
        services = astore.services
        data = astore.data

        astore.initialState.planning.currentPlanningId = data.plannings[0]._id
        store = undefined
    })

    const setStore = () => {
        astore.init()

        store = createTestStore({
            initialState: astore.initialState,
            extraArguments: {
                api: services.api,
                notify: services.notify,
            },
        })
    }

    const getWrapper = () => {
        const wrapper = mount(
            <Provider store={store}>
                <PlanningForm />
            </Provider>
        )

        const form = wrapper.find('form')
        const coveragesField = wrapper.find(CoveragesFieldArray)

        return {
            wrapper,
            form,
            coveragesField,
            addCoverageButton: coveragesField.find('.Coverage__add-btn'),
        }
    }

    describe('coverages', () => {
        it('removes a coverage', (done) => {
            setStore()
            const { form, coveragesField } = getWrapper()

            expect(coveragesField.find('.Coverage__item').length).toBe(3)
            coveragesField.find('.Coverage__remove').first().simulate('click')
            expect(coveragesField.find('.Coverage__item').length).toBe(2)
            coveragesField.find('.Coverage__remove').first().simulate('click')
            expect(coveragesField.find('.Coverage__item').length).toBe(1)
            form.simulate('submit')

            setTimeout(() => {
                expect(services.api('coverage').remove.callCount).toBe(2)
                expect(services.api('coverage').remove.args[0]).toEqual([data.coverages[0]])
                expect(services.api('coverage').remove.args[1]).toEqual([data.coverages[1]])

                done()
            }, 500)
        })

        it('cannot remove all coverages', (done) => {
            astore.initialState.planning.currentPlanningId = data.plannings[1]._id
            setStore()

            const { form, coveragesField } = getWrapper()

            expect(coveragesField.find('.Coverage__item').length).toBe(1)
            coveragesField.find('.Coverage__remove').first().simulate('click')
            form.simulate('submit')

            setTimeout(() => {
                expect(services.notify.error.callCount).toBe(1)
                expect(services.notify.error.args[0])
                    .toEqual(['The planning item must have at least one coverage.'])
                done()
            }, 250)
        })

        it('new coverages copies metadata from planning item', () => {
            setStore()
            const { coveragesField, addCoverageButton } = getWrapper()

            expect(coveragesField.find('.Coverage__item').length).toBe(3)
            addCoverageButton.simulate('click')
            expect(coveragesField.find('.Coverage__item').length).toBe(4)

            const coveragesProps = coveragesField.props()
            expect(coveragesProps.headline).toBe('Some Plan 1')
            expect(coveragesProps.fields.length).toBe(4)
            expect(get(coveragesProps.fields.get(3), 'planning.headline', '')).toBe('Some Plan 1')

        })
    })
})
