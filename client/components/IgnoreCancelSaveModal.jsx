import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {eventUtils, gettext, isItemPublic} from '../utils';
import {ITEM_TYPE} from '../constants';
import * as selectors from '../selectors';

import {Row} from './UI/Preview';
import {UpdateMethodSelection} from './ItemActionConfirmation';
import {EventUpdateMethods, EventScheduleSummary} from './Events';
import {ConfirmationModal} from './';

export class IgnoreCancelSaveModalComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {eventUpdateMethod: EventUpdateMethods[0]};

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onEventUpdateMethodChange(field, option) {
        this.setState({eventUpdateMethod: option});
    }

    renderEvent() {
        const {dateFormat, timeFormat, modalProps} = this.props;

        const {
            item,
            onSave,
        } = modalProps || {};
        const {submitting} = this.state;

        const isRecurringEvent = eventUtils.isEventRecurring(item);

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!item.slugline}
                    label={gettext('Slugline')}
                    value={item.slugline || ''}
                    noPadding={true}
                    className="slugline"
                />

                <Row
                    label={gettext('Name')}
                    value={item.name || ''}
                    noPadding={true}
                    className="strong"
                />

                <EventScheduleSummary
                    schedule={item.dates}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                />

                {onSave && (
                    <UpdateMethodSelection
                        value={this.state.eventUpdateMethod}
                        onChange={this.onEventUpdateMethodChange}
                        showMethodSelection={isRecurringEvent}
                        updateMethodLabel={gettext('Update all recurring events or just this one?')}
                        showSpace={false}
                        readOnly={submitting}
                        action="spike"
                    />
                )}
            </div>
        );
    }

    renderPlanning() {
        const {item} = get(this.props, 'modalProps') || {};

        return (
            <div className="MetadataView">
                <Row
                    enabled={!!item.slugline}
                    label={gettext('Slugline')}
                    value={item.slugline || ''}
                    noPadding={true}
                    className="slugline"
                />
            </div>
        );
    }

    onSubmit() {
        const {onGoTo, onSave} = this.props.modalProps || {};

        if (onGoTo) {
            return onGoTo();
        }

        return onSave(
            false,
            this.state.eventUpdateMethod
        );
    }

    render() {
        const {handleHide, modalProps} = this.props;
        const {
            item,
            itemType,
            title,
            onIgnore,
            onCancel,
            onSave,
            onGoTo,
            autoClose,
        } = modalProps || {};

        let okText;

        if (onGoTo) {
            okText = gettext('GoTo');
        } else if (get(item, '_id')) {
            okText = isItemPublic(item) ?
                gettext('Update') :
                gettext('Save');
        } else {
            okText = gettext('Create');
        }

        return (
            <ConfirmationModal
                handleHide={handleHide}
                modalProps={{
                    onCancel: onCancel,
                    cancelText: gettext('Cancel'),
                    showIgnore: true,
                    ignore: onIgnore,
                    ignoreText: gettext('Ignore'),
                    action: (onGoTo || onSave) ? this.onSubmit : null,
                    okText: okText,
                    title: title || gettext('Save Changes?'),
                    body: itemType === ITEM_TYPE.EVENT ?
                        this.renderEvent() :
                        this.renderPlanning(),
                    autoClose: autoClose,
                }}
            />
        );
    }
}

IgnoreCancelSaveModalComponent.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        item: PropTypes.object,
        itemType: PropTypes.string,
        onCancel: PropTypes.func,
        onIgnore: PropTypes.func,
        onSave: PropTypes.func,
        onGoTo: PropTypes.func,
        title: PropTypes.string,
        autoClose: PropTypes.bool,
    }),
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    currentEditId: PropTypes.string,
};

const mapStateToProps = (state) => ({
    dateFormat: selectors.config.getDateFormat(state),
    timeFormat: selectors.config.getTimeFormat(state),
    currentEditId: selectors.forms.currentItemId(state),
});

export const IgnoreCancelSaveModal = connect(
    mapStateToProps,
    null
)(IgnoreCancelSaveModalComponent);
