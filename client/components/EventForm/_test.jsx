import React from 'react'
import { mount, shallow } from 'enzyme'
import { EventForm, FormComponent, Component } from '../EventForm/index'
import sinon from 'sinon'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import { cloneDeep } from 'lodash'
import * as actions from '../../actions'
import eventsUi from '../../actions/events/ui'
import moment from 'moment'
import { restoreSinonStub } from '../../utils/testUtils'

describe('events', () => {
    describe('components', () => {
        const event = {
            _id: '5800d71930627218866f1e80',
            dates: {
                start: moment('2016-10-15T14:30+0000'),
                end: moment('2016-10-20T15:00+0000'),
            },
            definition_short: 'definition_short 1',
            location: [{ name: 'location1' }],
            name: 'name1',
            files: [{
                media: {
                    name: 'file.pdf',
                    length: 1000,
                },
                filemeta: { media_id: 'media1' },
            }],
            links: ['http://www.google.com'],
            _plannings: [],
        }

        const createTestStoreForEventEditing = (event) => {
            return createTestStore({
                initialState: {
                    events: {
                        readOnly: false,
                        events: { '5800d71930627218866f1e80' : event },
                        showEventDetails: '5800d71930627218866f1e80',
                    },
                    users: [
                        {
                            _id: 'user123',
                            display_name: 'foo',
                        },
                    ],
                    session: {
                        identity: { _id: 'user123' },
                        sessionId: 'session123',
                    },
                },
            })

        }

        describe('<EventForm />', () => {
            it('uploads and keeps files', (done) => {
                const newEvent = cloneDeep(event)
                const store = createTestStore()
                newEvent.files.push([{}])
                store.dispatch(actions.saveFiles(newEvent))
                .then((e) => {
                    expect(e.files).toBeDefined()
                    expect(e.files.length).toBe(newEvent.files.length)
                    done()
                })
            })

            it('submit the form', () => {
                const submitting = false
                const onSaveResponse = Promise.resolve()
                const handleSubmit = sinon.stub().returns(onSaveResponse)
                const props = {
                    submitting: submitting,
                    handleSubmit,
                }
                const subject = shallow(<Component {...props}/>)
                subject.find('form').simulate('submit')
                expect(handleSubmit.callCount).toBe(2)
            })

            it('save the event', () => {
                const getState = () => ({ events: { events: {} } })
                const dispatch = sinon.spy(() => (Promise.resolve()))
                const api = () => ({
                    save: sinon.spy((original, newEvent) => {
                        expect(newEvent.dates.tz).toEqual(jasmine.any(String))
                        expect(newEvent.dates.start).toEqual(event.dates.start)
                        return Promise.resolve()
                    }),
                })
                const action = actions.uploadFilesAndSaveEvent(event)
                action(dispatch, getState, { api })
            })

            it('duplicate an event', () => {
                const store = createTestStore()
                store.dispatch(actions.duplicateEvent(event))
            })

            it('compute right dates', () => {
                const expectDatesInStoreToBe = (expectedDates) => {
                    let { start, end } = store.getState().form.addEvent.values.dates
                    expect(start).toBe(expectedDates.start)
                    expect(end).toBe(expectedDates.end)
                }

                let store = createTestStoreForEventEditing()
                const initialValues = event
                mount(
                    <Provider store={store}>
                        <EventForm initialValues={initialValues} />
                    </Provider>
                )
                let originalDates = event.dates
                expectDatesInStoreToBe(originalDates)
            })

            it('fill the form', () => {
                let store = createTestStoreForEventEditing()
                const initialValues = event
                const wrapper = mount(
                    <Provider store={store}>
                        <EventForm initialValues={initialValues} />
                    </Provider>
                )
                expect(wrapper.find('[name="name"]').props().value).toBe(initialValues.name)
            })

            it('detects a non recurring event', () => {
                const store = createTestStoreForEventEditing()
                // check with default values if doesRepeat is false
                expect(mount(<Provider store={store}><EventForm /></Provider>)
                    .find(FormComponent).props().doesRepeat
                ).toBe(false)
            })

            it('detects a recurring event', () => {
                const store = createTestStoreForEventEditing()
                const recEvent = {
                    ...event,
                    dates: {
                        start: moment('2016-10-15T14:30+0000'),
                        end: moment('2016-10-20T15:00+0000'),
                        recurring_rule: { frequency: 'YEARLY' },
                    },
                }
                expect(mount(<Provider store={store}><EventForm initialValues={recEvent} /></Provider>)
                    .find(FormComponent).props().doesRepeat
                ).toBe(true)
            })

            it('supports files', () => {
                let _event = event
                _event.lock_user = 'user123'
                _event.lock_session = 'session123'
                const store = createTestStoreForEventEditing(_event)
                const wrapper = mount(<Provider store={store}><EventForm initialValues={event}/></Provider>)
                const field = wrapper.find('FileFieldComponent')
                const file = field.props().file
                expect(field.props().fieldName).toBe('files[0]')
                expect(file).toEqual(event.files[0])
                expect(field.props().createLink(file)).toBe('http://server.com/upload/media1/raw')
                // add a file
                expect(wrapper.find('FileFieldComponent').length).toBe(1)
                wrapper.find('FilesFieldArray').find('.File__add-btn').simulate('click')
                expect(wrapper.find('FileFieldComponent').length).toBe(2)
            })

            it('supports links', () => {
                let _event = event
                _event.lock_user = 'user123'
                _event.lock_session = 'session123'
                const store = createTestStoreForEventEditing(_event)
                const wrapper = mount(<Provider store={store}><EventForm initialValues={event} /></Provider>)
                const field = wrapper.find('LinkFieldComponent')
                const link = field.props().link
                expect(field.props().fieldName).toBe('links[0]')
                expect(link).toEqual(event.links[0])
                const titleNode = field.find('.line-input').last()
                expect(titleNode.text()).toBe('http://www.google.com ')
                // add a link
                expect(wrapper.find('LinkFieldComponent').length).toBe(1)
                wrapper.find('LinksFieldArray').find('.Link__add-btn').simulate('click')
                expect(wrapper.find('LinkFieldComponent').length).toBe(2)
                wrapper.find('form').simulate('submit')
            })

            it('hides the save button if event is spiked', () => {
                let wrapper = shallow(
                    <Component
                        initialValues={{
                            _id: 'event123',
                            state: 'spiked',
                        }}
                        handleSubmit={sinon.spy()}
                        unspikeEvent={() => {}}
                        spikeEvent={() => {}}
                    />
                )
                expect(wrapper.find('[type="submit"]').length).toBe(0)

                wrapper = shallow(
                    <Component
                        initialValues={{ state: 'active' }}
                        handleSubmit={sinon.spy()}
                        unspikeEvent={() => {}}
                        spikeEvent={() => {}}
                    />
                )
                expect(wrapper.find('[type="submit"]').length).toBe(1)
            })

            it('Recurrence rules input fields are disabled when metadata is edited', () => {
                const recEvent = {
                    ...event,
                    dates: {
                        start: moment('2016-10-15T14:30+0000'),
                        end: moment('2016-10-20T15:00+0000'),
                        recurring_rule: {
                            frequency: 'DAILY',
                            endRepeatMode: 'count',
                        },
                    },
                    lock_user: 'user123',
                    lock_session: 'session123',
                }
                const store = createTestStoreForEventEditing(recEvent)
                const wrapper = mount(<Provider store={store}><EventForm initialValues={recEvent}
                    formValues={recEvent} /></Provider>)
                expect(wrapper.find(FormComponent).props().doesRepeat).toBe(true)
                wrapper.find('LinksFieldArray').find('.Link__add-btn').simulate('click')
                expect(wrapper.find('.error-block').length).toBe(1)
                expect(wrapper.find('.error-block').get(0).textContent).toBe('Editing event\'s recurring rules values disabled')
            })

            it('Metadata input fields are disabled when recurring rule is edited', () => {
                const recEvent = {
                    ...event,
                    dates: {
                        start: moment('2016-10-15T14:30+0000'),
                        end: moment('2016-10-20T15:00+0000'),
                        recurring_rule: {
                            frequency: 'DAILY',
                            endRepeatMode: 'count',
                        },
                    },
                    lock_user: 'user123',
                    lock_session: 'session123',
                }
                const store = createTestStoreForEventEditing(recEvent)
                const wrapper = mount(<Provider store={store}><EventForm initialValues={recEvent}
                    formValues={recEvent} /></Provider>)
                expect(wrapper.find(FormComponent).props().doesRepeat).toBe(true)
                const allDayToggleBtn = wrapper.find('.sd-toggle').at(0)
                allDayToggleBtn.find('span').first().simulate('click')
                expect(wrapper.find('.error-block').length).toBe(1)
                expect(wrapper.find('.error-block').get(0).textContent).toBe('Editing event\'s metadata disabled')
            })

            it('Metadata and recurring rules can be edited for non-recurring event', () => {
                const _event = {
                    ...event,
                    lock_user: 'user123',
                    lock_session: 'session123',
                }
                const store = createTestStoreForEventEditing(_event)
                const wrapper = mount(<Provider store={store}><EventForm initialValues={_event}/></Provider>)
                expect(wrapper.find(FormComponent).props().doesRepeat).toBe(false)
                expect(wrapper.find('FileFieldComponent').props().readOnly).toBe(false)
                expect(wrapper.find('DayPickerInput').at(0).props().readOnly).toBe(false)
            })

            it('Cannot spike/create new events if only metadata of a recurring event is edited', () => {
                const recEvent = {
                    ...event,
                    dates: {
                        start: moment('2016-10-15T14:30+0000'),
                        end: moment('2016-10-20T15:00+0000'),
                        recurring_rule: {
                            frequency: 'DAILY',
                            endRepeatMode: 'count',
                        },
                    },
                    lock_user: 'user123',
                    lock_session: 'session123',
                }
                const store = createTestStoreForEventEditing(recEvent)
                const wrapper = mount(<Provider store={store}><EventForm initialValues={recEvent}
                    enableReinitialize={true}/></Provider>)
                expect(wrapper.find(FormComponent).props().doesRepeat).toBe(true)
                wrapper.find('LinksFieldArray').find('.Link__add-btn').simulate('click')
                expect(wrapper.find('ItemActionsMenu').props().actions.length).toBe(2)
                expect(wrapper.find('ItemActionsMenu').props().actions[0].label).toBe('Create Planning Item')
                expect(wrapper.find('ItemActionsMenu').props().actions[1].label).toBe('View Event History')
            })

            describe('allDay Toggle', () => {
                it('detects an all day event', () => {
                    const store = createTestStoreForEventEditing()
                    const allDayEvent = {
                        ...event,
                        dates: {
                            start: moment('2017-06-16T00:00'),
                            end: moment('2017-06-16T23:59'),
                        },
                    }
                    const wrapper = mount(
                        <Provider store={store}>
                            <EventForm initialValues={allDayEvent} />
                        </Provider>
                    )
                    expect(wrapper.find(FormComponent).props().isAllDay).toBe(true)
                })

                it('detects a non all day event', () => {
                    const store = createTestStoreForEventEditing()
                    const nonAllDayEvent = {
                        ...event,
                        dates: {
                            start: moment('2017-06-16T00:00'),
                            end: moment('2017-06-16T12:01'),
                        },
                    }
                    const wrapper = mount(
                        <Provider store={store}>
                            <EventForm initialValues={nonAllDayEvent} />
                        </Provider>
                    )
                    expect(wrapper.find(FormComponent).props().isAllDay).toBe(false)
                })
            })

            describe('Actions menu', () => {
                beforeEach(() => {
                    sinon.stub(eventsUi, 'openSpikeModal').callsFake(() => ({ type: 'MOCK' }))
                })

                afterEach(() => {
                    restoreSinonStub(eventsUi.openSpikeModal)
                })

                it('spike action calls `actions.events.ui.openSpikeModal`', () => {
                    const store = createTestStoreForEventEditing(event)
                    const wrapper = mount(
                        <Provider store={store}>
                            <EventForm initialValues={event}/>
                        </Provider>
                    )

                    const actionsMenu = wrapper.find('ItemActionsMenu')

                    actionsMenu.find('.dropdown__toggle').simulate('click')
                    actionsMenu.find('button[children="Spike Event"]').simulate('click')

                    expect(eventsUi.openSpikeModal.callCount).toBe(1)
                    expect(eventsUi.openSpikeModal.args[0]).toEqual([event])
                })
            })
        })
    })
})
