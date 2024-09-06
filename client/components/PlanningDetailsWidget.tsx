import React from 'react';
import {Provider} from 'react-redux';
import {connectServices} from 'superdesk-core/scripts/core/helpers/ReactRenderAsync';
import {PlanningPreviewContent} from './Planning/PlanningPreviewContent';
import {modifyForClient} from '../utils/planning';
import {WORKSPACE} from '../constants';
import {fetchAgendas} from '../actions';

interface IPropsConnected {
    api: any;
    sdPlanningStore: any;
}

interface IPropsOwn {
    item: {
        assignment_id: string;
    };
    noPadding?: boolean; // defaults to false
}

type IProps = IPropsConnected & IPropsOwn;

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
    static defaultProps: Partial<IProps>;
    readonly state = {store: null, planning: null};

    componentDidMount() {
        const {item, api, sdPlanningStore} = this.props;

        // Allow the Planning item and store to be loaded concurrently
        getItemPlanningInfo(item, api).then((planning) => {
            this.setState({planning});
        });

        sdPlanningStore.initWorkspace(WORKSPACE.AUTHORING_WIDGET, (store) => {
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

        const Container: React.ComponentType<{children: React.ReactNode}>
            = this.props.noPadding
                ? ({children}) => <div>{children}</div>
                : ({children}) => <div className="widget sd-padding-all--2">{children}</div>;

        return (
            <Container>
                <Provider store={this.state.store}>
                    <PlanningPreviewContent item={this.state.planning} noPadding={this.props.noPadding} />
                </Provider>
            </Container>
        );
    }
}

PlanningDetailsWidget.defaultProps = {
    noPadding: false,
};

const component: React.ComponentType<IPropsOwn> = connectServices<IProps>(
    PlanningDetailsWidget,
    ['api', 'sdPlanningStore'],
);

export default component;
