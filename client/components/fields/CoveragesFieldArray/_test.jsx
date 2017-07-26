import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { CoveragesFieldArrayComponent } from './index'

describe('<CoveragesFieldArray />', () => {
    let fields
    let wrapper
    let instance
    let coverage

    beforeEach(() => {
        coverage = {
            planning: {
                headline: 'Header',
                assigned_to: { desk: 'desk1' },
                g2_content_type: 'text',
            },
        }

        fields = {
            get: sinon.spy(() => coverage),
            push: sinon.spy(),
            remove: sinon.spy(),
            map: sinon.spy(),
        }

        wrapper = shallow(
            <CoveragesFieldArrayComponent
                fields={fields}
                headline="Header"
                slugline="Slugger"
                users={[]}
                contentTypes={[]}/>
        )

        instance = wrapper.instance()
    })

    it('adds new coverage', () => {
        instance.newCoverage()
        expect(fields.push.callCount).toBe(1)
        expect(fields.push.args[0]).toEqual([{
            planning: {
                headline: 'Header',
                slugline: 'Slugger',
            },
        }])
    })

    it('removes a coverage', () => {
        instance.removeCoverage(1)
        expect(fields.remove.callCount).toBe(1)
        expect(fields.remove.args[0]).toEqual([1])
    })

    it('duplicates a coverage', () => {
        instance.duplicateCoverage(0)

        expect(fields.push.callCount).toBe(1)
        expect(fields.push.args[0]).toEqual([{
            planning: {
                ...coverage.planning,
                assigned_to: null,
            },
        }])
    })

    it('duplicates a coverage as', () => {
        instance.duplicateCoverage(0, 'video')

        expect(fields.push.callCount).toBe(1)
        expect(fields.push.args[0]).toEqual([{
            planning: {
                ...coverage.planning,
                assigned_to: null,
                g2_content_type: 'video',
            },
        }])
    })
})
