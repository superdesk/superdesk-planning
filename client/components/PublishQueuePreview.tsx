import React from 'react';
import {connect} from 'react-redux';
import {isEqual} from 'lodash';
import {Loader} from 'superdesk-ui-framework/react';

import {IAssignmentOrPlanningItem} from '../interfaces';
import * as actions from '../actions';
import * as selectors from '../selectors';
import {PreviewPanel} from './Main';

interface IStateProps {
    item: IAssignmentOrPlanningItem;
}

interface IDispatchProps {
    fetchQueueItemAndPreview(item: IAssignmentOrPlanningItem): Promise<any>;
}

type IProps = IStateProps & IDispatchProps;

interface IState {
    loading: boolean;
}

class PublishQueuePreviewComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {loading: true};
    }

    componentDidMount() {
        this.loadItem();
    }

    componentDidUpdate(prevProps: Readonly<IProps>) {
        if (this.props.item && !isEqual(this.props.item, prevProps.item)) {
            this.loadItem();
        }
    }

    loadItem() {
        this.setState({loading: true}, () => {
            this.props.fetchQueueItemAndPreview(this.props.item)
                .finally(() => this.setState({loading: false}));
        });
    }

    render() {
        return (
            <div className="sd-preview-panel  preview-pane content-item-preview">
                {this.state.loading ? (
                    <Loader />
                ) : (
                    <PreviewPanel
                        showUnlock={false}
                        hideItemActions={true}
                        hideEditIcon={true}
                        inPlanning={false}
                        hideRelatedItems={true}
                        hideHistory={true}
                    />
                )}
            </div>
        );
    }
}

const mapStateToProps = (state) => ({item: selectors.main.publishQueuePreviewItem(state)});

const mapDispatchToProps = (dispatch) => ({
    fetchQueueItemAndPreview: (item) => dispatch(actions.main.fetchQueueItemAndPreview(item)),
});

export const PublishQueuePreview = connect<IStateProps, IDispatchProps, {}>(
    mapStateToProps, mapDispatchToProps)(PublishQueuePreviewComponent
);
