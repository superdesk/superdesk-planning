import React from 'react'
import { shallow } from 'enzyme'
import { EventScheduleForm } from './index'
import sinon from 'sinon'
import moment from 'moment'

describe('<EventScheduleForm />', () => {
    const getShallowWrapper = ({
        initialSchedule={},
        currentSchedule=undefined,
        readOnly=false,
        change=sinon.spy(),
        pristine=false,
        showRepeat=true,
        showRepeatSummary=true,
    }) => (shallow(
        <EventScheduleForm
            initialSchedule={initialSchedule}
            currentSchedule={currentSchedule || initialSchedule}
            readOnly={readOnly}
            change={change}
            pristine={pristine}
            showRepeat={showRepeat}
            showRepeatSummary={showRepeatSummary}
        />
    ))

    it('detects a non recurring event', () => {
        const wrapper = getShallowWrapper({
            initialSchedule: {
                start: '2016-10-15T13:01:11',
                end: '2016-10-15T14:01:11',
            },
        })
        expect(wrapper.state().doesRepeat).toBe(false)
    })

    it('detects a recurring event', () => {
        const wrapper = getShallowWrapper({
            initialSchedule: {
                start: '2016-10-15T13:01:11',
                end: '2016-10-15T14:01:11',
                recurring_rule: { frequency: 'DAILY' },
            },
        })
        expect(wrapper.state().doesRepeat).toBe(true)
    })

    it('detects a non all day event', () => {
        const wrapper = getShallowWrapper({
            initialSchedule: {
                start: '2016-10-15T13:01:11',
                end: '2016-10-15T14:01:11',
            },
        })
        expect(wrapper.state().isAllDay).toBe(false)
    })

    it('detects an all day event', () => {
        const wrapper = getShallowWrapper({
            initialSchedule: {
                start: moment('2099-06-16T00:00'),
                end: moment('2099-06-16T23:59'),
            },
        })
        expect(wrapper.state().isAllDay).toBe(true)
    })
})
