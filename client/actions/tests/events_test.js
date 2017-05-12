import sinon from 'sinon'
import * as actions from '../events'
import { PRIVILEGES } from '../../constants'

describe('events', () => {
    describe('actions', () => {
        let events = [
            {
                _id: 'e1',
                name: 'Event 1',
                dates: { start: '2016-10-15T13:01:11+0000' },
            },
            {
                _id: 'e2',
                name: 'Event 2',
                dates: { start: '2014-10-15T14:01:11+0000' },
            },
            {
                _id: 'e3',
                name: 'Event 3',
                dates: { start: '2015-10-15T14:01:11+0000' },
            },
        ]
        const initialState = {
            events: {
                events: {
                    e1: events[0],
                    e2: events[1],
                    e3: events[2],
                },
                eventsInList: [],
                search: {
                    advancedSearchOpened: false,
                    currentSearch: { fulltext: undefined },
                },
                show: true,
                showEventDetails: null,
                selectedEvent: null,
            },
            privileges: {
                planning: 1,
                planning_event_management: 1,
            },
            planning: { plannings: {} },
            config: { server: { url: 'http://server.com' } },
        }
        const getState = () => (initialState)
        const dispatch = sinon.spy(() => (Promise.resolve()))
        const notify = {
            error: sinon.spy(),
            success: sinon.spy(),
        }
        const $timeout = sinon.spy((func) => func())
        const $location = { search: sinon.spy(() => (Promise.resolve())) }

        const upload = {
            start: sinon.spy((file) => (Promise.resolve({
                data: {
                    _id: file.data.media[0][0],
                    file,
                },
            }))),
        }

        let apiSpy
        const api = () => (apiSpy)

        beforeEach(() => {

            apiSpy = {
                query: sinon.spy(() => (Promise.resolve({ _items: events }))),
                remove: sinon.spy(() => (Promise.resolve())),
                save: sinon.spy((ori, item) => (Promise.resolve({
                    _id: 'e4',
                    ...ori,
                    ...item,
                }))),
            }

            notify.error.reset()
            notify.success.reset()
            dispatch.reset()
        })

        it('uploadFilesAndSaveEvent', () => {
            initialState.events.selectedEvent = true
            initialState.events.showEventDetails = true
            const event = {}
            const action = actions.uploadFilesAndSaveEvent(event)
            return action(dispatch, getState)
            .then(() => {
                // Cannot check dispatch(saveFiles(event)) using a spy on dispatch
                // As saveFiles is a thunk function

                // Cannot check dispatch(saveLocation(event)) using a spy on dispatch
                // As saveLocation is a thunk function

                // Cannot check dispatch(saveEvent(event)) using a spy on dispatch
                // As saveEvent is a thunk function

                expect(dispatch.args[3][0].type).toBe('ADD_EVENTS')
                expect(dispatch.args[4][0].type).toBe('ADD_TO_EVENTS_LIST')

                expect(dispatch.args[5]).toEqual([{ type: 'CLOSE_EVENT_DETAILS' }])

                // Cannot check dispatch(openEventDetails()) using a spy on dispatch
                // As openEventDetails is a thunk function

                expect(dispatch.callCount).toBe(7)
            })
        })

        it('deleteEvent', () => {
            const action = actions.deleteEvent(events[2])
            return action(dispatch, getState, {
                api,
                notify,
            })
            .then(() => {
                expect(apiSpy.remove.args[0]).toEqual([events[2]])

                expect(dispatch.args[0]).toEqual([{ type: 'HIDE_MODAL' }])

                // Cannot check dispatch(fetchEvents()) using a spy on dispatch
                // As fetchEvents is a thunk function

                expect(dispatch.callCount).toBe(2)
            })
        })

        it('deleteEvent notify error if no event given', () => {
            const action = actions.deleteEvent()
            return action(dispatch, getState, {
                api,
                notify,
            })
            .then(() => {
                expect(apiSpy.remove.callCount).toBe(0)
                expect(notify.error.args[0]).toEqual(['Failed to delete the event!'])
            })
        })

        it('saveFiles', () => {
            const event = {
                files: [
                    ['test_file_1'],
                    ['test_file_2'],
                ],
            }

            const action = actions.saveFiles(event)
            return action(dispatch, getState, { upload })
            .then((newEvent) => {
                expect(upload.start.callCount).toBe(2)
                expect(upload.start.args[0]).toEqual([{
                    method: 'POST',
                    url: 'http://server.com/events_files/',
                    headers: { 'Content-Type': 'multipart/form-data' },
                    data: { media: [event.files[0]] },
                    arrayKey: '',
                }])
                expect(upload.start.args[1]).toEqual([{
                    method: 'POST',
                    url: 'http://server.com/events_files/',
                    headers: { 'Content-Type': 'multipart/form-data' },
                    data: { media: [event.files[1]] },
                    arrayKey: '',
                }])

                expect(newEvent.files).toEqual(['test_file_1', 'test_file_2'])
            })
        })

        it('silentlyFetchEventsById', () => {
            const action = actions.silentlyFetchEventsById(['e1', 'e2', 'e3'])
            return action(dispatch)
            .then(() => {
                // Cannot check dispatch(performFetchQuery()) using a spy on dispatch
                // As performFetchQuery is a thunk function

                expect(dispatch.args[1][0].type).toBe('ADD_EVENTS')
                expect(dispatch.args[1][0].payload).toBe(events)

                expect(dispatch.callCount).toBe(2)
            })
        })

        it('fetchEvents', () => {
            const params = {}
            const action = actions.fetchEvents(params)
            return action(dispatch, getState, {
                $timeout,
                $location,
            })
            .then(() => {
                expect(dispatch.args[0]).toEqual([{
                    type: 'REQUEST_EVENTS',
                    payload: params,
                }])

                // Cannot check dispatch(performFetchQuery()) using a spy on dispatch
                // As performFetchQuery is a thunk function

                expect(dispatch.args[2][0].type).toBe('ADD_EVENTS')
                expect(dispatch.args[2][0].events).toBe(events)

                expect(dispatch.args[3]).toEqual([{
                    type: 'SET_EVENTS_LIST',
                    payload: ['e1', 'e2', 'e3'],
                }])

                expect($timeout.callCount).toBe(1)

                expect($location.search.args[0]).toEqual([
                    'searchEvent',
                    JSON.stringify(params),
                ])

                expect(dispatch.callCount).toBe(4)
            })
        })

        it('addToEventsList', () => {
            const ids = ['e4', 'e5', 'e6']
            const action = actions.addToEventsList(ids)
            expect(action).toEqual({
                type: 'ADD_TO_EVENTS_LIST',
                payload: ids,
            })
        })

        it('openAdvancedSearch', () => {
            const action = actions.openAdvancedSearch()
            expect(action).toEqual({ type: 'OPEN_ADVANCED_SEARCH' })
        })

        it('closeAdvancedSearch', () => {
            const action = actions.closeAdvancedSearch()
            expect(action).toEqual({ type: 'CLOSE_ADVANCED_SEARCH' })
        })

        describe('openEventDetails', () => {
            const action = actions.openEventDetails(events[0])
            it('openEventDetails dispatches actions', () => {
                action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                expect(dispatch.args[0]).toEqual([{
                    type: 'OPEN_EVENT_DETAILS',
                    payload: events[0]._id,
                }])
                expect(dispatch.callCount).toBe(1)
                expect(notify.error.callCount).toBe(0)
                expect($timeout.callCount).toBe(0)
            })

            it('openEventDetails raises ACCESS_DENIED without permission', () => {
                initialState.privileges.planning_event_management = 0
                action(dispatch, getState, {
                    notify,
                    $timeout,
                })
                expect($timeout.callCount).toBe(1)
                expect(notify.error.args[0][0]).toBe(
                    'Unauthorised to edit an event!'
                )
                expect(dispatch.args[0]).toEqual([{
                    type: PRIVILEGES.ACTIONS.ACCESS_DENIED,
                    payload: {
                        action: '_openEventDetails',
                        permission: PRIVILEGES.EVENT_MANAGEMENT,
                        errorMessage: 'Unauthorised to edit an event!',
                        args: [events[0]],
                    },
                }])
                expect(dispatch.callCount).toBe(1)
            })
        })

        it('closeEventDetails', () => {
            const action = actions.closeEventDetails()
            expect(action).toEqual({ type: 'CLOSE_EVENT_DETAILS' })
        })

        it('receiveEvents', () => {
            const action = actions.receiveEvents(events)
            expect(action.type).toBe('ADD_EVENTS')
            expect(action.payload).toEqual(events)
        })

        it('toggleEventsList', () => {
            const action = actions.toggleEventsList()
            expect(action).toEqual({ type: 'TOGGLE_EVENT_LIST' })
        })

        it('openDeleteEvent', () => {
            const action = actions.openDeleteEvent(events[2])
            return action(dispatch, getState)
            .then(() => {
                expect(dispatch.args[0][0].type).toBe('SHOW_MODAL')
                expect(dispatch.args[0][0].modalType).toBe('CONFIRMATION')
            })
        })
    })
})
