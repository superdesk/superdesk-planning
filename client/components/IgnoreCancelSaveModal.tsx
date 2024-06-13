import React from 'react';
import {connect} from 'react-redux';

import {IEventItem, IEventOrPlanningItem, IEventUpdateMethod, IPlanningItem} from '../interfaces';
import {gettext, isItemPublic, isExistingItem} from '../utils';
import {EVENTS} from '../constants';
import * as selectors from '../selectors';

import {Row} from './UI/Preview';
import {ConfirmationModal} from './';
import {UpdateRecurringEventsForm} from './ItemActionConfirmation';

interface IBaseProps<T extends IEventOrPlanningItem> {
    handleHide(itemType: IEventOrPlanningItem['_id']): void;
    currentEditId: T['_id'];
    modalProps: {
        item: T;
        updates: Partial<T>;
        onCancel(): void;
        onIgnore(): void;
        onSave(
            withConfirmation: boolean,
            updateMethod: string,
            planningUpdateMethods: {[planningId: string]: IEventUpdateMethod}
        ): void;
        onGoTo(): void;
        onSaveAndPost(
            withConfirmation: boolean,
            updateMethod: string,
            planningUpdateMethods: {[planningId: string]: IEventUpdateMethod}
        ): void;
        title: string;
        autoClose?: boolean;
        bodyText?: string;
        showIgnore?: boolean;
    };
}

type IProps = IBaseProps<IEventItem> | IBaseProps<IPlanningItem>;

interface IState {
    eventUpdateMethod: IEventUpdateMethod;
    planningUpdateMethods: {[planningId: string]: IEventUpdateMethod};
}

export class IgnoreCancelSaveModalComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            eventUpdateMethod: EVENTS.UPDATE_METHODS[0].value,
            planningUpdateMethods: {},
        };

        this.onEventUpdateMethodChange = this.onEventUpdateMethodChange.bind(this);
        this.onPlanningUpdateMethodChange = this.onPlanningUpdateMethodChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onEventUpdateMethodChange(option: IEventUpdateMethod) {
        this.setState({eventUpdateMethod: option});
    }

    onPlanningUpdateMethodChange(planningId: IPlanningItem['_id'], updateMethod: IEventUpdateMethod) {
        this.setState((prevState) => ({
            planningUpdateMethods: {
                ...prevState.planningUpdateMethods,
                [planningId]: updateMethod,
            },
        }));
    }

    renderItemDetails() {
        if (this.props.modalProps.item.type === 'planning') {
            return (
                <div className="MetadataView">
                    <Row
                        enabled={!!this.props.modalProps.item.slugline}
                        label={gettext('Slugline')}
                        value={this.props.modalProps.item.slugline || ''}
                        noPadding={true}
                        className="slugline"
                    />
                </div>
            );
        } else if (this.props.modalProps.item.type === 'event') {
            return (
                <UpdateRecurringEventsForm
                    original={this.props.modalProps.item}
                    updates={this.props.modalProps.updates}
                    onEventUpdateMethodChange={this.onEventUpdateMethodChange}
                    onPlanningUpdateMethodChange={this.onPlanningUpdateMethodChange}
                    modalProps={{
                        onCloseModal: () => {
                            this.props.handleHide(this.props.modalProps.item.type);
                        },
                        unlockOnClose: false,
                    }}
                />
            );
        }

        return null;
    }

    onSubmit() {
        const {onGoTo, onSave, onSaveAndPost} = this.props.modalProps || {};

        if (onGoTo) {
            return onGoTo();
        } else if (onSaveAndPost) {
            return onSaveAndPost(
                false,
                this.state.eventUpdateMethod,
                this.state.planningUpdateMethods,
            );
        }

        return onSave(
            false,
            this.state.eventUpdateMethod,
            this.state.planningUpdateMethods,
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

    render() {
        const {handleHide, modalProps} = this.props;
        const {
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
                    showIgnore: showIgnore !== true,
                    ignore: onIgnore,
                    ignoreText: gettext('Ignore'),
                    action: (onGoTo || onSave || onSaveAndPost) ? this.onSubmit : null,
                    okText: okText,
                    title: title || gettext('Save Changes?'),
                    body: bodyText || this.renderItemDetails(),
                    autoClose: autoClose,
                    large: true,
                    bodyClassname: 'p-3',
                }}
            />
        );
    }
}

const mapStateToProps = (state) => ({
    currentEditId: selectors.forms.currentItemId(state),
});

export const IgnoreCancelSaveModal = connect(
    mapStateToProps,
    null
)(IgnoreCancelSaveModalComponent);
