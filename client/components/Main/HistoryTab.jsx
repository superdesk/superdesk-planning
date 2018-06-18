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
    componentWillMount() {
        const {fetchItemHistory, item} = this.props;

        fetchItemHistory(item);
    }

    componentWillReceiveProps(nextProps) {
        const nextId = get(nextProps, 'item._id', null);
        const currentId = get(this.props, 'item._id', null);

        if (nextId !== currentId) {
            this.props.fetchItemHistory(nextProps.item);
        }
    }

    render() {
        const itemType = getItemType(this.props.item);
        const {historyItems, users, desks, agendas, timeFormat, dateFormat, openItemPreview} = this.props;
        const itemProps = {
            historyItems: historyItems,
            users: users,
            timeFormat: timeFormat,
            dateFormat: dateFormat,
            desks: desks,
            openItemPreview: openItemPreview,
        };

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
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,
    forEditor: PropTypes.bool,
};

const mapStateToProps = (state, ownProps) => ({
    users: selectors.general.users(state),
    historyItems: ownProps.forEditor ? selectors.forms.editorItemHistory(state) :
        selectors.main.previewItemHistory(state),
    desks: selectors.general.desks(state),
    agendas: selectors.general.agendas(state),
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    fetchItemHistory: (item) => (
        dispatch(main.fetchItemHistory(item, false, ownProps.forEditor))
    ),
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

