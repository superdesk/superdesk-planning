import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, isNil} from 'lodash';

import {eventUtils, gettext, isItemPublic, isExistingItem} from '../utils';
import {ITEM_TYPE, EVENTS} from '../constants';
import * as selectors from '../selectors';

import {Row} from './UI/Preview';
import {UpdateMethodSelection} from './ItemActionConfirmation';
import {EventScheduleSummary} from './Events';
import {ConfirmationModal} from './';

export class IgnoreCancelSaveModalComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {eventUpdateMethod: EVENTS.UPDATE_METHODS[0]};

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onEventUpdateMethodChange(field, option) {
        this.setState({eventUpdateMethod: option});
    }

    renderEvent() {
        const {modalProps} = this.props;

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

                <EventScheduleSummary schedule={item.dates} />

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
        const {onGoTo, onSave, onSaveAndPost} = this.props.modalProps || {};

        if (onGoTo) {
            return onGoTo();
        } else if (onSaveAndPost) {
            return onSaveAndPost(
                false,
                this.state.eventUpdateMethod
            );
        }

        return onSave(
            false,
            this.state.eventUpdateMethod
        );
    }

    getOkText() {
        const {item, onGoTo, onSaveAndPost} = this.props.modalProps || {};
        let okText;

        if (onGoTo) {
            okText = gettext('Go-To');
        } else if (isExistingItem(item)) {
            if (isItemPublic(item)) {
                okText = onSaveAndPost ?
                    gettext('Save & Post') :
                    gettext('Update');
            } else {
                okText = gettext('Save');
            }
        } else if (item) {
            okText = gettext('Create');
        } else {
            okText = gettext('Save');
        }


        return okText;
    }

    getRenderItem(itemType) {
        switch (itemType) {
        case ITEM_TYPE.EVENT:
            return this.renderEvent();

        case ITEM_TYPE.PLANNING:
            return this.renderPlanning();
        }

        return null;
    }

    render() {
        const {handleHide, modalProps} = this.props;
        const {
            itemType,
            title,
            onIgnore,
            onCancel,
            onSave,
            onGoTo,
            onSaveAndPost,
            autoClose,
            bodyText,
            showIgnore,
        } = modalProps || {};

        const okText = this.getOkText();

        return (
            <ConfirmationModal
                handleHide={handleHide}
                modalProps={{
                    onCancel: onCancel,
                    cancelText: gettext('Cancel'),
                    showIgnore: isNil(showIgnore) ? true : showIgnore,
                    ignore: onIgnore,
                    ignoreText: gettext('Ignore'),
                    action: (onGoTo || onSave || onSaveAndPost) ? this.onSubmit : null,
                    okText: okText,
                    title: title || gettext('Save Changes?'),
                    body: bodyText || this.getRenderItem(itemType),
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
        onSaveAndPost: PropTypes.func,
        title: PropTypes.string,
        autoClose: PropTypes.bool,
        bodyText: PropTypes.string,
    }),
    currentEditId: PropTypes.string,
};

const mapStateToProps = (state) => ({
    currentEditId: selectors.forms.currentItemId(state),
});

export const IgnoreCancelSaveModal = connect(
    mapStateToProps,
    null
)(IgnoreCancelSaveModalComponent);
