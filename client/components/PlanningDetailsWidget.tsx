import React from 'react';
import {Provider} from 'react-redux';
import ng from 'superdesk-core/scripts/core/services/ng';
import {PlanningPreviewContent} from './Planning/PlanningPreviewContent';
import {modifyForClient} from '../utils/planning';
import {WORKSPACE} from '../constants';
import {fetchAgendas} from '../actions';

interface IProps {
    item: {
        assignment_id: string;
    };
}

interface IState {
    store: any;
    planning: any;
}

export function getItemPlanningInfo(item: {assignment_id: string}) {
    const api = ng.get('api');

    if (item.assignment_id != null) {
        return api.find('assignments', item.assignment_id)
            .then((assignment) => api.find('planning', assignment.planning_item))
            .then((planning) => modifyForClient(planning));
    }

    return Promise.reject();
}

class PlanningDetailsWidget extends React.Component<IProps, IState> {
    static defaultProps: Partial<IProps>;
    readonly state = {store: null, planning: null};
    private sdPlanningStore: any;
    private planningId: string | null = null;
    private unsubscribe: (() => void) | null = null;

    constructor(props: IProps) {
        super(props);
        this.sdPlanningStore = ng.get('sdPlanningStore');
    }

    componentDidMount() {
        const {item} = this.props;

        getItemPlanningInfo(item).then((planning) => {
            this.planningId = planning._id;
            this.setState({planning});
        });

        this.sdPlanningStore.initWorkspace(WORKSPACE.AUTHORING_WIDGET, (store) => {
            store.dispatch(fetchAgendas()).then(() => {
                this.setState({store});
            });
        });

        const $rootScope = ng.get('$rootScope');

        this.unsubscribe = $rootScope.$on('planning:updated', (_e: any, updatedPlanning: any) => {
            const updatedPlanningId = updatedPlanning?.item;

            if (!this.planningId || !updatedPlanningId || updatedPlanningId !== this.planningId) {
                return;
            }

            getItemPlanningInfo(this.props.item).then((planning) => {
                this.setState({planning});
            });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        // Only render if we have both the planning item and store
        if (!this.state.planning || !this.state.store) {
            return null;
        }

        return (
            <Provider store={this.state.store}>
                <PlanningPreviewContent item={this.state.planning} noPadding />
            </Provider>
        );
    }
}

export default PlanningDetailsWidget;
