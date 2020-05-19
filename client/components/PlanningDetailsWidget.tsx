import React from 'react';
import {Provider} from 'react-redux';
import {connectServices} from 'superdesk-core/scripts/core/helpers/ReactRenderAsync';
import {PlanningPreviewContent} from './Planning/PlanningPreviewContent';
import {modifyForClient} from '../utils/planning';

interface IProps {
    api: any;
    sdPlanningStore: any;
    item: {
        assignment_id: string;
    };
}

interface IState {
    store: any;
    planning: any;
}

export function getItemPlanningInfo(item: IProps['item'], api: IProps['api']) {
    if (item.assignment_id != null) {
        return api.find('assignments', item.assignment_id)
            .then((assignment) => api.find('planning', assignment.planning_item))
            .then((planning) => modifyForClient(planning));
    }

    return Promise.reject();
}

class PlanningDetailsWidget extends React.Component<IProps, IState> {
    readonly state = {store: null, planning: null};

    componentDidMount() {
        const {item, api, sdPlanningStore} = this.props;

        getItemPlanningInfo(item, api)
            .then((planning) => {
                sdPlanningStore.createStore().then((store) => {
                    this.setState({store, planning});
                });
            });
    }

    render() {
        if (!this.state.planning) {
            return null;
        }

        return (
            <div className="widget sd-padding-all--2">
                <Provider store={this.state.store}>
                    <PlanningPreviewContent item={this.state.planning} />
                </Provider>
            </div>
        );
    }
}

export default connectServices<IProps>(
    PlanningDetailsWidget,
    ['api', 'sdPlanningStore'],
);
