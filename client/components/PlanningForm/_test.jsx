import { createTestStore } from '../../utils'
import { getTestActionStore } from '../../utils/testUtils'
import { mount } from 'enzyme'
import { PlanningForm, CoverageContainer } from '../index'
import { CoveragesFieldArray } from '../fields'
import React from 'react'
import { Provider } from 'react-redux'

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

    const getWrapper = (readOnly=false) => {
        const wrapper = mount(
            <Provider store={store}>
                <PlanningForm readOnly={readOnly}/>
            </Provider>
        )

        const form = wrapper.find('form')
        const coveragesField = wrapper.find(CoveragesFieldArray)

        return {
            wrapper,
            form,
            coveragesField,
            addCoverageButton: coveragesField.find('.Coverage__add-btn'),
            coverageContainers: () => form.find(CoverageContainer),
        }
    }

    describe('coverages', () => {
        it('removes a coverage', (done) => {
            setStore()
            const { form, coverageContainers } = getWrapper()

            expect(coverageContainers().length).toBe(3)

            coverageContainers().at(0).find('.dropdown__toggle').simulate('click')
            coverageContainers().at(0).find('li button .icon-trash').simulate('click')
            expect(coverageContainers().length).toBe(2)

            coverageContainers().at(0).find('.dropdown__toggle').simulate('click')
            coverageContainers().at(0).find('li button .icon-trash').simulate('click')
            expect(coverageContainers().length).toBe(1)

            form.simulate('submit')

            setTimeout(() => {
                expect(services.api('coverage').remove.callCount).toBe(2)
                expect(services.api('coverage').remove.args[0]).toEqual([data.coverages[0]])
                expect(services.api('coverage').remove.args[1]).toEqual([data.coverages[1]])

                done()
            }, 500)
        })

        it('cannot remove all coverages', () => {
            setStore()
            const { coverageContainers } = getWrapper()

            expect(coverageContainers().length).toBe(3)

            coverageContainers().at(0).find('.dropdown__toggle').simulate('click')
            coverageContainers().at(0).find('li button .icon-trash').simulate('click')
            expect(coverageContainers().length).toBe(2)

            coverageContainers().at(0).find('.dropdown__toggle').simulate('click')
            coverageContainers().at(0).find('li button .icon-trash').simulate('click')
            expect(coverageContainers().length).toBe(1)

            expect(coverageContainers().at(0).find('li button .icon-trash').length).toBe(0)
        })

        it('new coverages copies metadata from planning item', () => {
            setStore()
            const { coveragesField, addCoverageButton, coverageContainers } = getWrapper()

            expect(coverageContainers().length).toBe(3)
            addCoverageButton.simulate('click')
            expect(coverageContainers().length).toBe(4)

            const coveragesProps = coveragesField.props()
            expect(coveragesProps.headline).toBe('Some Plan 1')
            expect(coveragesProps.slugline).toBe('Planning1')
            expect(coveragesProps.fields.length).toBe(4)
            expect(coveragesProps.fields.get(3).planning.headline).toBe('Some Plan 1')
            expect(coveragesProps.fields.get(3).planning.slugline).toBe('Planning1')

        })
    })
})
