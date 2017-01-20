import React from 'react'
import { mount, shallow } from 'enzyme'
import AddEventForm, { FormComponent, Component } from '../AddEventForm'
import sinon from 'sinon'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import * as actions from '../../actions'

const event = {
    _id: '5800d71930627218866f1e80',
    dates: { start: '2016-10-15T14:30+0000', end: '2016-10-20T15:00+0000' },
    definition_short: 'definition_short 1',
    location: [{ name: 'location1' }],
    name: 'name1'
}

describe('<FormComponent />', () => {
    it('submit the form', () => {
        let submitting = false
        let onSaveResponse = Promise.resolve()
        let handleSubmit = sinon.stub().returns(onSaveResponse)
        const props = {
            modalType: 'EDIT_EVENT',
            submitting: submitting,
            handleSubmit,
        }
        let subject = shallow(<Component {...props}/>)
        subject.find('form').simulate('submit')
        expect(handleSubmit.callCount).toBe(1)
    })
    it('save the event', () => {
        const getState = () => ({ events: { events: [] } })
        const dispatch = sinon.spy()
        const api = () => ({
            save: sinon.spy((original, newEvent) => {
                expect(newEvent.dates.tz).toEqual(jasmine.any(String))
                expect(newEvent.dates.start).toEqual(event.dates.start)
                return Promise.resolve()
            })
        })
        const action = actions.saveEvent(event)
        action(dispatch, getState, { api })
    })
    it('compute right dates', () => {
        const expectDatesInStoreToBe = (expectedDates) => {
            let { start, end } = store.getState().form.addEvent.values.dates
            expect(start.isSame(expectedDates.start)).toBe(true)
            expect(end.isSame(expectedDates.end)).toBe(true)
        }

        let store = createTestStore()
        const initialValues = event
        mount(
            <Provider store={store}>
                <AddEventForm initialValues={initialValues} />
            </Provider>
        )
        let originalDates = event.dates
        expectDatesInStoreToBe(originalDates)
    })
    it('calls onSubmit() and ensure that modal is closed', (done) => {
        const store = createTestStore()
        const wrapper = mount(<Provider store={store}><AddEventForm /></Provider>)
        // open the modal (in store)
        store.dispatch(actions.showModal({ modalType: 'EDIT_EVENT', modalProps: { event: {} } }))
        expect(store.getState().modal.modalType).toBe('EDIT_EVENT')
        wrapper.find(FormComponent).props().onSubmit(event).then(() => {
            // modal is closed
            expect(store.getState().modal.modalType).toBe(null)
            done()
        })
    })
    it('fill the form', () => {
        let store = createTestStore()
        const initialValues = event
        const wrapper = mount(
            <Provider store={store}>
                <FormComponent initialValues={initialValues} />
            </Provider>
        )
        expect(wrapper.find('[name="name"]').props().value).toBe(initialValues.name)
    })
    it('detects a recurring event', () => {
        const store = createTestStore()
        // check with default values if doesRepeat is false
        expect(mount(<Provider store={store}><AddEventForm /></Provider>)
            .find(FormComponent).props().doesRepeat
        ).toBe(false)
        // check with a recurring event if doesRepeat is true
        const recEvent = {
            ...event,
            dates: {
                start: '2016-10-15T14:30+0000',
                end: '2016-10-20T15:00+0000',
                recurring_rule: {
                    frequency: 'YEARLY'
                }
            }
        }
        expect(mount(<Provider store={store}><AddEventForm initialValues={recEvent} /></Provider>)
            .find(FormComponent).props().doesRepeat
        ).toBe(true)
    })
})
