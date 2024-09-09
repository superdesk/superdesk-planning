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

    constructor(props: IProps) {
        super(props);

        this.sdPlanningStore = ng.get('sdPlanningStore');
    }

    componentDidMount() {
        const {item} = this.props;

        // Allow the Planning item and store to be loaded concurrently
        getItemPlanningInfo(item).then((planning) => {
            this.setState({planning});
        });

        this.sdPlanningStore.initWorkspace(WORKSPACE.AUTHORING_WIDGET, (store) => {
            // Fetch the agendas before saving the store to the state
            store.dispatch(fetchAgendas()).then(() => {
                this.setState({store});
            });
        });
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
