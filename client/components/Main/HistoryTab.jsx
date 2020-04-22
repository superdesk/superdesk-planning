import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {ITEM_TYPE} from '../../constants';
import * as selectors from '../../selectors';
import {main} from '../../actions';
import {getItemType} from '../../utils';
import {EventHistory} from '../Events/';
import {PlanningHistory} from '../Planning/';

export class HistoryTabComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {fetchingHistory: false};
    }

    componentWillMount() {
        const {fetchItemHistory, item} = this.props;

        this.setState({fetchingHistory: true});
        fetchItemHistory(item);
    }

    componentWillReceiveProps(nextProps) {
        const nextId = get(nextProps, 'item._id', null);
        const currentId = get(this.props, 'item._id', null);

        if (nextId !== currentId) {
            this.setState({fetchingHistory: true});
            this.props.fetchItemHistory(nextProps.item);
            return;
        }

        if (this.state.fetchingHistory && get(nextProps, 'historyItems.length', 0) > 0) {
            this.setState({fetchingHistory: false});
        }
    }

    render() {
        const itemType = getItemType(this.props.item);
        const {historyItems, users, desks, agendas, openItemPreview, contentTypes} = this.props;
        const itemProps = {
            historyItems: historyItems,
            users: users,
            desks: desks,
            openItemPreview: openItemPreview,
            contentTypes: contentTypes,
        };

        if (this.state.fetchingHistory) {
            return null;
        }

        switch (itemType) {
        case ITEM_TYPE.EVENT:
            return (<EventHistory {...itemProps} />);

        case ITEM_TYPE.PLANNING:
            return (<PlanningHistory agendas={agendas} {...itemProps} />);

        default:
            return null;
        }
    }
}

HistoryTabComponent.propTypes = {
    item: PropTypes.object,
    historyItems: PropTypes.array,
    fetchItemHistory: PropTypes.func,
    openItemPreview: PropTypes.func,
    users: PropTypes.array,
    desks: PropTypes.array,
    agendas: PropTypes.array,
    forEditor: PropTypes.bool,
    forEditorModal: PropTypes.bool,
    contentTypes: PropTypes.array,
};

const getHistoryItems = (props) => {
    if (props.forEditor) {
        return selectors.forms.editorItemHistory;
    }

    if (props.forEditorModal) {
        return selectors.forms.editorModalItemHistory;
    }

    return selectors.main.previewItemHistory;
};

const mapStateToProps = (state, ownProps) => ({
    users: selectors.general.users(state),
    historyItems: getHistoryItems(ownProps)(state),
    desks: selectors.general.desks(state),
    agendas: selectors.general.agendas(state),
    contentTypes: selectors.general.contentTypes(state),
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    fetchItemHistory: (item) => dispatch(main.fetchItemHistory(item)),
    openItemPreview: (id, type) => (
        dispatch(main.openPreview({
            _id: id,
            type: type,
        }))
    ),
});

export const HistoryTab = connect(
    mapStateToProps,
    mapDispatchToProps
)(HistoryTabComponent);

