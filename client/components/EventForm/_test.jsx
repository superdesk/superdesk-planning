import React from 'react'
import { mount, shallow } from 'enzyme'
import { EventForm, FormComponent, Component } from '../EventForm/index'
import sinon from 'sinon'
import { createTestStore } from '../../utils'
import { Provider } from 'react-redux'
import { cloneDeep } from 'lodash'
import * as actions from '../../actions'
import moment from 'moment'

describe('events', () => {
    describe('containers', () => {
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

        describe('<FormComponent />', () => {
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
                expect(handleSubmit.callCount).toBe(1)
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

            it('compute right dates', () => {
                const expectDatesInStoreToBe = (expectedDates) => {
                    let { start, end } = store.getState().form.addEvent.values.dates
                    expect(start).toBe(expectedDates.start)
                    expect(end).toBe(expectedDates.end)
                }

                let store = createTestStore()
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
                let store = createTestStore()
                const initialValues = event
                const wrapper = mount(
                    <Provider store={store}>
                        <FormComponent initialValues={initialValues} />
                    </Provider>
                )
                expect(wrapper.find('[name="name"]').props().value).toBe(initialValues.name)
            })
            it('detects a non recurring event', () => {
                const store = createTestStore()
                // check with default values if doesRepeat is false
                expect(mount(<Provider store={store}><EventForm /></Provider>)
                    .find(FormComponent).props().doesRepeat
                ).toBe(false)
            })

            it('detects a recurring event', () => {
                const store = createTestStore()
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
                const store = createTestStore({
                    initialState: {
                        events: {
                            readOnly: false,
                            events: { '5800d71930627218866f1e80' : event },
                        },
                    },
                })
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
                const store = createTestStore({
                    initialState: {
                        events: {
                            readOnly: false,
                            events: { '5800d71930627218866f1e80' : event },
                        },
                    },
                })
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
                        initialValues={{ state: 'spiked' }}
                        handleSubmit={sinon.spy()}
                    />
                )
                expect(wrapper.find('[type="submit"]').length).toBe(0)

                wrapper = shallow(
                    <Component
                        initialValues={{ state: 'active' }}
                        handleSubmit={sinon.spy()}
                    />
                )
                expect(wrapper.find('[type="submit"]').length).toBe(1)
            })
        })
    })
})
