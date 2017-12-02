import React from 'react'
import { mount, shallow } from 'enzyme'
import { EventForm, Component } from '../EventForm/index'
import sinon from 'sinon'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import { cloneDeep, get } from 'lodash'
import * as actions from '../../actions'
import eventsUi from '../../actions/events/ui'
import moment from 'moment'
import { restoreSinonStub, itemActionExists } from '../../utils/testUtils'
import * as helpers from '../tests/helpers'
import { FORM_NAMES } from '../../constants'
import * as testData from '../../utils/testData'

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
            state: 'draft',
            _type: 'events',
        }

        const requiredProps = {
            publish: sinon.spy(),
            unpublish: sinon.spy(),
            saveAndPublish: sinon.spy(),
            spikeEvent: sinon.spy(),
            unspikeEvent: sinon.spy(),
            onCancelEvent: sinon.spy(),
            onRescheduleEvent: sinon.spy(),
            onPostponeEvent: sinon.spy(),
            addEventToCurrentAgenda: sinon.spy(),
            duplicateEvent: sinon.spy(),
            updateTime: sinon.spy(),
            convertToRecurringEvent: sinon.spy(),
            handleSubmit: sinon.spy(),
        }

        const createTestStoreForEventEditing = (testEvent) => {
            return createTestStore({
                initialState: {
                    events: {
                        ...testData.eventsInitialState,
                        readOnly: false,
                        events: { [testEvent._id] : { ...testEvent } },
                        showEventDetails: testEvent._id,
                    },
                    locks: {
                        ...testData.locks,
                        events: !get(testEvent, 'lock_user') ? {} : {
                            [testEvent._id]: {
                                action: 'edit',
                                user: testEvent.lock_user,
                                session: testEvent.lock_session,
                                // user: testData.users[0]._id,
                                // session: testData.sessions[0].sessionId,
                                item_type: 'events',
                                item_id: testEvent._id,
                                time: '2016-10-15T14:30+0000',
                            },
                        },
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
                let store = createTestStoreForEventEditing(event)
                store.getState().formsProfile.events.editor.links.enabled = false
                const wrapper = mount(
                    <Provider store={store}>
                        <EventForm initialValues={{...event}} />
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
                const priv = { planning_event_publish: 1 }
                const onMinimize =  sinon.stub().returns(Promise.resolve())
                const props = {
                    ...requiredProps,
                    submitting: submitting,
                    handleSubmit,
                    ...itemActions,
                    privileges: priv,
                    onMinimize,
                    initialValues: {},
                    lockedItems: {
                        events: {},
                        planning: {},
                        recurring: {},
                        assignments: {},
                    },
                }
                const subject = shallow(<Component {...props}/>)
                subject.find('form').simulate('submit')
                expect(handleSubmit.callCount).toBe(1)
            })

            it('compute right dates', () => {
                const expectDatesInStoreToBe = (expectedDates) => {
                    let { start, end } = store.getState().form[FORM_NAMES.EventForm].values.dates
                    expect(start).toBe(expectedDates.start)
                    expect(end).toBe(expectedDates.end)
                }

                let store = createTestStoreForEventEditing(event)
                mount(
                    <Provider store={store}>
                        <EventForm initialValues={{ ...event }} />
                    </Provider>
                )
                let originalDates = event.dates
                expectDatesInStoreToBe(originalDates)
            })

            it('fill the form', () => {
                let store = createTestStoreForEventEditing(event)
                const initialValues = event
                const wrapper = mount(
                    <Provider store={store}>
                        <EventForm initialValues={initialValues} />
                    </Provider>
                )
                expect(wrapper.find('[name="name"]').props().value).toBe(initialValues.name)
            })

            it('supports files', () => {
                const _event = {
                    ...event,
                    lock_user: testData.users[0]._id,
                    lock_session: testData.sessions[0].sessionId,
                }

                const store = createTestStoreForEventEditing(_event)
                const wrapper = mount(
                    <Provider store={store}>
                        <EventForm initialValues={_event}/>
                    </Provider>
                )

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
                const _event = {
                    ...event,
                    lock_user: testData.users[0]._id,
                    lock_session: testData.sessions[0].sessionId,
                }

                const store = createTestStoreForEventEditing(_event)
                const wrapper = mount(
                    <Provider store={store}>
                        <EventForm initialValues={_event} />
                    </Provider>
                )

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
                        lockedItems={{
                            events: {},
                            planning: {},
                            recurring: {},
                            assignments: {},
                        }}
                    />
                )
                expect(wrapper.find('[type="submit"]').length).toBe(0)

                wrapper = shallow(
                    <Component
                        {...requiredProps}
                        initialValues={{ state: 'draft' }}
                        privileges={priv}
                        onMinimize={sinon.spy()}
                        lockedItems={{
                            events: {},
                            planning: {},
                            recurring: {},
                            assignments: {},
                        }}
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
                    store.getState().locks.events = {}

                    const wrapper = mount(
                        <Provider store={store}>
                            <EventForm initialValues={event}/>
                        </Provider>
                    )

                    const menu = new helpers.actionMenu(wrapper)
                    expect(menu.actionLabels()).toContain('Spike')
                    menu.invokeAction('Spike')

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
                        lock_user: testData.users[1]._id,
                        lock_session: testData.sessions[1].sessionId,
                    }

                    const store = createTestStoreForEventEditing(recEvent)
                    const wrapper = mount(
                        <Provider store={store}>
                            <EventForm
                                initialValues={recEvent}
                                enableReinitialize={true}
                            />
                        </Provider>
                    )
                    expect(wrapper.find('ItemActionsMenu').props().actions.length).toBe(2)
                    expect(itemActionExists(wrapper, 'View History')).toBe(true)
                })
            })

            it('action button states for new event', () => {
                let store = createTestStoreForEventEditing(event)
                const wrapper = mount(
                    <Provider store={store}>
                        <EventForm initialValues={{}} />
                    </Provider>
                )
                const subnav = wrapper.find('.subnav__actions')
                // New event without changing any values
                expect(subnav.find('.btn').first().prop('disabled')).toBe(false)
                expect(subnav.find('.btn--primary').first().prop('disabled')).toBe(true)

                // Save and publish should be hidden
                expect(subnav.find('.btn--success').length).toBe(0)

                // Change values to enable the `save` and `save & publish` buttons
                wrapper.find('Field [name="slugline"]')
                    .simulate('change', { target: { value: 'NewSlug' } })
                expect(subnav.find('.btn').first().prop('disabled')).toBe(false)
                expect(subnav.find('.btn--primary').first().prop('disabled')).toBe(false)

                // Save and publish should still be hidden
                expect(subnav.find('.btn--success').length).toBe(0)
            })

            it('action button states for existing event', () => {
                const _event = {
                    ...event,
                    lock_user: testData.users[0]._id,
                    lock_session: testData.sessions[0].sessionId,
                }

                let store = createTestStoreForEventEditing(_event)
                const wrapper = mount(
                    <Provider store={store}>
                        <EventForm initialValues={_event} />
                    </Provider>
                )
                const subnav = wrapper.find('.subnav__actions')
                // New event without changing any values
                expect(subnav.find('.btn').first().prop('disabled')).toBe(false)
                expect(subnav.find('.btn--primary').first().prop('disabled')).toBe(true)
                expect(subnav.find('.btn--success').first().prop('disabled')).toBe(false)
                expect(subnav.find('.btn--success').first().text()).toBe('Publish')

                // Change values to enable the `save` and `save & publish` buttons
                wrapper.find('Field [name="slugline"]')
                    .simulate('change', { target: { value: 'NewSlug' } })
                expect(subnav.find('.btn').first().prop('disabled')).toBe(false)
                expect(subnav.find('.btn--primary').first().prop('disabled')).toBe(false)
                expect(subnav.find('.btn--success').first().prop('disabled')).toBe(false)
                expect(subnav.find('.btn--success').first().text()).toBe('Save and publish')
            })
        })
    })
})
