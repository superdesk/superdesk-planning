import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {PreviewPanel} from './Main/ItemPreview';
import * as actions from '../actions';
import * as selectors from '../selectors';
import {isEqual} from 'lodash';


class PublishQueuePreviewComponent extends React.Component {
    componentDidMount() {
        const {item} = this.props;

        this.props.fetchQueueItemAndPreview(item);
    }

    componentWillReceiveProps(nextProps) {
        const {item} = nextProps;
        const previousItem = this.props.item;

        if (item && !isEqual(item, previousItem)) {
            return this.props.fetchQueueItemAndPreview(item)
                .then(() => this.props.fetchAgendas());
        }
    }

    render() {
        return (
            <div className="sd-preview-panel  preview-pane content-item-preview">
                <PreviewPanel
                    showUnlock={false}
                    hideItemActions={true}
                    hideEditIcon={true}
                    inPlanning={false}
                    hideRelatedItems={true}
                    hideHistory={true}
                />
            </div>
        );
    }
}

PublishQueuePreviewComponent.propTypes = {
    item: PropTypes.object,
    fetchQueueItemAndPreview: PropTypes.func,
    fetchAgendas: PropTypes.func,
};

const mapStateToProps = (state) => ({item: selectors.main.publishQueuePreviewItem(state)});

const mapDispatchToProps = (dispatch) => ({
    fetchQueueItemAndPreview: (item) => dispatch(actions.main.fetchQueueItemAndPreview(item)),
    fetchAgendas: () => dispatch(actions.fetchAgendas()),
});

export const PublishQueuePreview = connect(mapStateToProps, mapDispatchToProps)(PublishQueuePreviewComponent);
