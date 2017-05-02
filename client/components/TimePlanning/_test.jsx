import React from 'react'
import { mount } from 'enzyme'
import { TimePlanning } from '../index'
import moment from 'moment'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'


describe('<TimePlanning />', () => {
    function renderToText(event) {
        const store = createTestStore()
        const wrapper = mount(
            <Provider store={store}>
                <TimePlanning event={event}/>
            </Provider>
        )
        try {
            return wrapper.text()
        } catch (e) {
            return ''
        }
    }
    it('renders an event', () => {
        const event = {
            dates: {
                start: moment('2016-10-15T13:01:00+0000'),
                end: moment('2016-10-15T14:01:00+0000'),
            },
        }
        expect(renderToText(event)).toBe(
            moment(event.dates.start).format('DD/MM/YYYY HH:mm')
        )
    })
    it('renders a full day event', () => {
        const event = {
            dates: {
                start: moment('2016-10-15T22:00:00+0000'),
                end: moment('2016-10-16T22:00:00+0000'),
                tz: 'Europe/Berlin',
            },
        }
        expect(renderToText(event)).toBe(
            moment(event.dates.start).format('DD/MM/YYYY')
        )
    })
    it('renders an event that ends on another day', () => {
        const event = {
            dates: {
                start: moment('2016-10-15T08:00:00+0000'),
                end: moment('2016-10-16T11:00:00+0000'),
            },
        }
        expect(renderToText(event)).toBe(
            moment(event.dates.start).format('DD/MM/') + ' - ' +
            moment(event.dates.end).format('DD/MM/YYYY')
        )
    })
    it('there is no event', () => {
        expect(renderToText()).toBe('')
    })
})
