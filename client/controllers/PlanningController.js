import React from 'react'
import ReactDOM from 'react-dom'
import { PlanningApp } from '../containers'
import { Provider } from 'react-redux'
import { createStore } from '../utils'
import * as actions from '../actions'

PlanningController.$inject = ['$element', '$scope', 'api', 'config', '$location', '$timeout',
    'vocabularies', 'superdesk', 'upload']
export function PlanningController($element, $scope, api, config, $location, $timeout,
    vocabularies, superdesk, upload) {
    // create the application store
    const store = createStore({
        initialState: {
            events: {
                events: {},
                eventsInList: [],
                show: true,
                search: {
                    currentSearch: $location.search().searchEvent &&
                        JSON.parse($location.search().searchEvent),
                    advancedSearchOpened: false,
                },
            },
            planning: {
                currentAgendaId: $location.search().agenda,
                editorOpened: false,
                currentPlanningId: null,
                agendas: [],
                planningsAreLoading: false,
                agendasAreLoading: false,
                plannings: {}, // plannings stored by _id
            },
            config: config,
        },
        extraArguments: {
            api,
            $location,
            $scope,
            $timeout,
            vocabularies,
            superdesk,
            upload,
        },
    })
    // load data in the store
    store.dispatch(actions.loadCVocabularies())
    // render the planning application
    ReactDOM.render(
        <Provider store={store}>
            <PlanningApp />
        </Provider>,
        $element.get(0)
    )
    // listen events
    $scope.$on('PlanningMenuItemClicked', () => {
        store.dispatch(actions.toggleEventsList())
    })
}
