import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import type {IDesk, IUser, IVocabularyItem, IContact} from 'superdesk-api';
import type {
    IAssignmentPriority,
    IAssignmentItem,
    ICoverageProvider,
    IContactType,
    IPlanningCoverageItem,
} from 'interfaces';

import {getDesksForUser} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import * as selectors from '../../selectors';

import {
    Label,
    Row,
    SelectInput,
    ColouredValueInput,
} from '../UI/Form';
import {ContactsPreviewList} from '../Contacts/ContactsPreviewList';
import {SelectSearchContactsField} from '../Contacts/SelectSearchContactsField';
import {superdeskApi} from '../../superdeskApi';
import {isAssignmentDeskValid} from '../../validators/assignments';

interface IReduxStateProps {
    contactTypes: Array<IContactType>

    priorities?: Array<IAssignmentPriority>;
    desks?: Array<IDesk>;
    users: Array<IUser>;
    coverageProviders?: Array<ICoverageProvider>;
}

interface IOwnProps {
    value: IAssignmentItem | IPlanningCoverageItem;
    onChange(diff: {[field: string]: string | ICoverageProvider | null}): void;
    priorityPrefix?: string;
    disableDeskSelection?: boolean;
    disableUserSelection?: boolean;
    popupContainer?: () => HTMLElement;
    showDesk?: boolean;
    showPriority?: boolean;
    className?: string;
}

type IProps = IOwnProps & IReduxStateProps;

export class AssignmentEditorComponent extends React.PureComponent<IProps> {
    FIELDS: {
        USER: string;
        DESK: string;
        PRIORITY: string;
        PROVIDER: string;
        CONTACT: string;
    };

    constructor(props: IProps) {
        super(props);

        this.FIELDS = {
            USER: 'assigned_to.user',
            DESK: 'assigned_to.desk',
            PRIORITY: `${props.priorityPrefix ?? ''}priority`,
            PROVIDER: 'assigned_to.coverage_provider',
            CONTACT: 'assigned_to.contact',
        };
    }

    getFilteredDesks = (userId?: IUser['_id']): Array<IDesk> => {
        return getDesksForUser(
            this.props.users.find((user) => user._id === userId),
            this.props.desks
        );
    }

    getContactType = (providerQcode: ICoverageProvider['qcode']): IContactType | null => {
        const provider = this.props.coverageProviders.find(
            (x) => x.qcode === providerQcode
        );

        return provider == null ? null : this.props.contactTypes.find(
            (contactType) => contactType.qcode === provider.contact_type
        );
    }

    onUserChange = (value?: IUser) => {
        this.props.onChange({[this.FIELDS.USER]: value?._id});
    }

    onContactChange = (contact: IContact) => {
        this.props.onChange({[this.FIELDS.CONTACT]: contact?._id});
    }

    removeContact = () => {
        this.props.onChange({[this.FIELDS.CONTACT]: null});
    }

    onDeskChange = (value?: IDesk) => {
        this.props.onChange({[this.FIELDS.DESK]: value?._id});
    }

    onPriorityChange = (value: IVocabularyItem) => {
        this.props.onChange({[this.FIELDS.PRIORITY]: value?.qcode});
    }

    onProviderChange = (provider?: ICoverageProvider) => {
        if (provider?.qcode === get(this.props.value, this.FIELDS.PROVIDER)) {
            return;
        }

        const diff: {[field: string]: string | ICoverageProvider | null} = {[this.FIELDS.PROVIDER]: provider};

        if (provider == null || provider.qcode == null) {
            diff[this.FIELDS.CONTACT] = null;
        } else {
            const oldContactType = this.getContactType(get(this.props.value, this.FIELDS.PROVIDER));
            const newContactType = this.getContactType(provider.qcode);

            if (oldContactType?.qcode !== newContactType?.qcode) {
                if (newContactType?.assignable === true) {
                    diff[this.FIELDS.USER] = null;
                } else {
                    diff[this.FIELDS.CONTACT] = null;
                }
            }
        }

        this.props.onChange(diff);
    }

    render() {
        const {
            value,
            coverageProviders,
            priorities,
            popupContainer,
            disableDeskSelection,
            disableUserSelection,
            showDesk = true,
            showPriority = true,
            className,
        } = this.props;
        const {gettext} = superdeskApi.localization;
        const {SelectUser} = superdeskApi.components;

        const userId = value.assigned_to?.user ?? null;

        const filteredDesks = this.getFilteredDesks(userId);
        const deskId = value.assigned_to?.desk ?? null;
        const isDeskValid = isAssignmentDeskValid(deskId);
        const desk = filteredDesks.find((desk) => desk._id === deskId);

        const priorityQcode = get(value, this.FIELDS.PRIORITY);
        const priority = priorities.find((x) => x.qcode === priorityQcode);

        const provider = get(value, this.FIELDS.PROVIDER);
        const contactType = this.getContactType(provider?.qcode);
        const contactId = get(value, this.FIELDS.CONTACT);

        return (
            <div className={className}>
                {showDesk && (
                    <Row id="form-row-desk">
                        <SelectInput
                            field={this.FIELDS.DESK}
                            label={gettext('Desk')}
                            value={desk}
                            onChange={(_field, val) => {
                                this.onDeskChange(val);
                            }}
                            options={filteredDesks}
                            labelField="name"
                            keyField="_id"
                            clearable={true}
                            readOnly={disableDeskSelection}
                            message={isDeskValid ? null : gettext('This field is required')}
                            invalid={!isDeskValid}
                            autoFocus
                        />
                    </Row>
                )}

                <Row noPadding={showDesk}>
                    <SelectInput
                        field={this.FIELDS.PROVIDER}
                        label={gettext('Coverage Provider')}
                        value={provider}
                        onChange={(_field, val) => {
                            this.onProviderChange(val);
                        }}
                        options={coverageProviders}
                        labelField="name"
                        keyField="qcode"
                        clearable={true}
                    />
                </Row>

                {contactType?.assignable === true ? (
                    <Row>
                        <Label text={gettext('Assigned Provider')} />
                        {contactId == null ? null : (
                            <ContactsPreviewList
                                contactIds={[this.props.value.assigned_to?.contact]}
                                onRemoveContact={this.removeContact}
                            />
                        )}
                        <SelectSearchContactsField
                            value={contactId == null ? [] : [contactId]}
                            onChange={this.onContactChange}
                            contactType={contactType.qcode}
                            minLengthPopup={0}
                            placeholder={gettext('Search provider contacts')}
                        />
                    </Row>
                ) : (
                    <Row style={{padding: '2rem 0', margin: '0 0 1.8em 0'}}>
                        <div data-test-id={this.FIELDS.USER}>
                            <SelectUser
                                disabled={disableUserSelection}
                                deskId={deskId}
                                selectedUserId={userId}
                                onSelect={(user) => {
                                    this.onUserChange(user);
                                }}
                                autoFocus={false}
                                horizontalSpacing={true}
                                clearable={true}
                            />
                        </div>
                    </Row>
                )}

                {showPriority && (
                    <Row>
                        <ColouredValueInput
                            field={this.FIELDS.PRIORITY}
                            label={gettext('Assignment Priority')}
                            value={priority}
                            onChange={(_field, val) => {
                                this.onPriorityChange(val);
                            }}
                            options={priorities}
                            iconName="priority-label"
                            noMargin={true}
                            popupContainer={popupContainer}
                            language={getUserInterfaceLanguageFromCV()}
                            clearable={true}
                        />
                    </Row>
                )}
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    contactTypes: selectors.vocabs.getContactTypes(state),
    priorities: selectors.getAssignmentPriorities(state),
    desks: selectors.general.desks(state),
    users: selectors.general.users(state),
    coverageProviders: selectors.vocabs.coverageProviders(state),
});

export const AssignmentEditor = connect<IReduxStateProps, {}, IOwnProps>(
    mapStateToProps
)(AssignmentEditorComponent);
