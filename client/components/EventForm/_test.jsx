import React from 'react'
import { mount, shallow } from 'enzyme'
import { EventForm, Component } from '../EventForm/index'
import sinon from 'sinon'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import { cloneDeep } from 'lodash'
import * as actions from '../../actions'
import eventsUi from '../../actions/events/ui'
import moment from 'moment'
import { restoreSinonStub, itemActionExists } from '../../utils/testUtils'

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
            state: 'in_progress',
        }

        const requiredProps = {
            publish: sinon.spy(),
            unpublish: sinon.spy(),
            saveAndPublish: sinon.spy(),
            spikeEvent: sinon.spy(),
            unspikeEvent: sinon.spy(),
            onCancelEvent: sinon.spy(),
            onRescheduleEvent: sinon.spy(),
            addEventToCurrentAgenda: sinon.spy(),
            duplicateEvent: sinon.spy(),
            updateTime: sinon.spy(),
            convertToRecurringEvent: sinon.spy(),
            handleSubmit: sinon.spy(),
        }

        const createTestStoreForEventEditing = (event) => {
            return createTestStore({
                initialState: {
                    events: {
                        readOnly: false,
                        events: { '5800d71930627218866f1e80' : event },
                        showEventDetails: '5800d71930627218866f1e80',
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

            it('disabled fields are not displayed in the form', () => {
                let store = createTestStoreForEventEditing()
                store.getState().formsProfile.events.editor.links.enabled = false

                const initialValues = event
                const wrapper = mount(
                    <Provider store={store}>
                        <EventForm initialValues={initialValues} />
                    </Provider>
                )
                expect(wrapper.find('LinkFieldComponent').length).toBe(0)
            })

            it('submit the form', () => {
                const submitting = false
                const onSaveResponse = Promise.resolve()
                const handleSubmit = sinon.stub().returns(onSaveResponse)
                const itemActions = {
                    unspikeEvent: () => {},
                    addEventToCurrentAgenda: () => {},
                    duplicateEvent: () => {},
                    spikeEvent: () => {},
                }
                const priv = { planning_event_management: 1 }
                const onMinimize =  sinon.stub().returns(Promise.resolve())
                const props = {
                    ...requiredProps,
                    submitting: submitting,
                    handleSubmit,
                    ...itemActions,
                    privileges: priv,
                    onMinimize,
                    initialValues: {},
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

            it('supports files', () => {
                let _event = event
                _event.lock_user = 'user123'
                _event.lock_session = 'session123'
                const store = createTestStoreForEventEditing(_event)
                const wrapper = mount(<Provider store={store}><EventForm initialValues={event}/></Provider>)
                wrapper.find('.toggle-box__header').at(1).simulate('click')
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
                wrapper.find('.toggle-box__header').at(2).simulate('click')
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
                const priv = { planning_event_management: 1 }
                let wrapper = shallow(
                    <Component
                        {...requiredProps}
                        initialValues={{
                            _id: 'event123',
                            state: 'spiked',
                        }}
                        privileges={priv}
                        onMinimize={sinon.spy()}
                    />
                )
                expect(wrapper.find('[type="submit"]').length).toBe(0)

                wrapper = shallow(
                    <Component
                        {...requiredProps}
                        initialValues={{ state: 'in_progress' }}
                        privileges={priv}
                        onMinimize={sinon.spy()}
                    />
                )
                expect(wrapper.find('[type="submit"]').length).toBe(1)
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
                    actionsMenu.find('li button').at(1).simulate('click')

                    expect(eventsUi.openSpikeModal.callCount).toBe(1)
                    expect(eventsUi.openSpikeModal.args[0]).toEqual([event])
                })

                it('Lock restricted event has only view-event-history action available', () => {
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
                        lock_user: 'somebodyelse',
                        lock_session: 'someothersession',
                    }
                    const store = createTestStoreForEventEditing(recEvent)
                    const wrapper = mount(<Provider store={store}><EventForm initialValues={recEvent}
                        enableReinitialize={true}/></Provider>)
                    expect(wrapper.find('ItemActionsMenu').props().actions.length).toBe(2)
                    expect(itemActionExists(wrapper, 'View History')).toBe(true)
                })
            })
        })
    })
})
