import React from 'react'
import { mount } from 'enzyme'
import { DueDate } from '../index'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import moment from 'moment'

describe('<DueDate />', () => {
    function renderDueDatesToText(dates) {
        const store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <DueDate dates={dates}/>
            </Provider>
        )
        return wrapper.text()
    }
    const date = '2016-10-15T13:01:00+0000'
    const dateSameDay = '2016-10-15T16:01:00+0000'
    const dateOtherDay = '2016-10-17T13:01:00+0000'
    it('renders a due date', () => {
        expect(renderDueDatesToText([
            date,
        ])).toBe(moment(date).format('DD/MM/YYYY HH:mm'))
    })
    it('renders a due date with two dates', () => {
        expect(renderDueDatesToText([
            date,
            dateSameDay,
        ])).toBe(
            moment(date).format('DD/MM/YYYY HH:mm') + ', ' +
            moment(dateSameDay).format('HH:mm')
        )
    })
    it('renders a due date with two dates from a different day', () => {
        expect(renderDueDatesToText([
            date,
            dateSameDay,
            dateOtherDay,
        ])).toBe(
            moment(date).format('DD/MM/ HH:mm') + ' - ' +
            moment(dateOtherDay).format('DD/MM/YYYY HH:mm')
        )
    })
})
