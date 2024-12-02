import React from 'react';
import {connect} from 'react-redux';
import {get, cloneDeep, isEqual} from 'lodash';

import {getUsersForDesk, getDesksForUser, gettext} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {validateItem} from '../../validators';
import {ASSIGNMENTS, ITEM_TYPE} from '../../constants';
import {getContactTypes} from '../../selectors/vocabs';

import {
    Label,
    Row,
    SelectInput,
    ColouredValueInput,
} from '../UI/Form';
import {ContactsPreviewList, SelectSearchContactsField} from '../Contacts';
import {superdeskApi} from '../../superdeskApi';
import {IDesk, IUser} from 'superdesk-api';
import {IAssignmentPriority} from 'interfaces';

interface IProps {
    value: any;
    onChange?: (...args: any) => any;
    users: Array<IUser>;
    desks?: Array<IDesk>;
    coverageProviders?: Array<any>;
    priorities?: Array<IAssignmentPriority>;
    priorityPrefix?: string;
    disableDeskSelection?: boolean;
    disableUserSelection?: boolean;
    popupContainer?: () => HTMLElement;
    showDesk?: boolean;
    showPriority?: boolean;
    className?: string;
    onValidate?: (diff: any, errors: any) => void;
    setValid?: (valid: boolean) => void;
    contactTypes?: Array<any>;
}

interface IState {
    userId: string;
    user: IUser;
    deskId: string;
    desk: IDesk;
    filteredUsers: Array<IUser>;
    filteredDesks: Array<IDesk>;
    priorityQcode: string;
    priority: any;
    errors: any;
    providerQcode: string | null;
    contactType: {qcode?: string; assignable?: string; name?: string} | null;
    contactId: string;
    contact?: any | null;
}

export class AssignmentEditorComponent extends React.Component<IProps, IState> {
    FIELDS: {[key: string]: string};

    constructor(props) {
        super(props);

        this.FIELDS = {
            USER: 'assigned_to.user',
            DESK: 'assigned_to.desk',
            PRIORITY: `${props.priorityPrefix ?? ''}priority`,
            PROVIDER: 'assigned_to.coverage_provider',
            CONTACT: 'assigned_to.contact',
        };

        const userId = get(props.value, this.FIELDS.USER);
        const user = props.users.find((x) => x._id === userId);

        const deskId = get(props.value, this.FIELDS.DESK);
        const desk = props.desks.find((x) => x._id === deskId);

        const filteredUsers = getUsersForDesk(desk, props.users);
        const filteredDesks = getDesksForUser(user, props.desks);

        const priorityQcode = get(props.value, this.FIELDS.PRIORITY);
        const priority = props.priorities.find((x) => x.qcode === priorityQcode);

        const contactId = get(props.value, this.FIELDS.CONTACT);
        const errors = {};

        this.state = {
            userId: userId,
            user: user,
            deskId: deskId,
            desk: desk,
            filteredUsers: filteredUsers,
            filteredDesks: filteredDesks,
            priorityQcode: priorityQcode,
            priority: priority,
            errors: errors,
            providerQcode: null,
            contactType: null,
            contactId: contactId,
        };

        this.onChange = this.onChange.bind(this);
        this.onUserChange = this.onUserChange.bind(this);
        this.onDeskChange = this.onDeskChange.bind(this);
        this.onPriorityChange = this.onPriorityChange.bind(this);
        this.onProviderChange = this.onProviderChange.bind(this);
        this.onContactChange = this.onContactChange.bind(this);
        this.removeContact = this.removeContact.bind(this);
    }

    componentWillMount() {
        // Force field validation
        this.onChange(null, null);
        if (!this.state.priorityQcode) {
            this.onPriorityChange(
                this.props.priorities.find((x) => x.qcode === ASSIGNMENTS.DEFAULT_PRIORITY),
            );
        }

        if (this.props.value[this.FIELDS.PROVIDER]) {
            this.setContactTypeAndId(
                this.props.value[`${this.FIELDS.PROVIDER}.contact_type`],
            );
        }
    }

    componentWillReceiveProps(nextProps) {
        const userId = get(nextProps.value, this.FIELDS.USER);
        const deskId = get(nextProps.value, this.FIELDS.DESK);
        const priorityQcode = get(nextProps.value, this.FIELDS.PRIORITY);

        if (userId !== this.state.userId) {
            this.onUserChange(nextProps.users.find((x) => x._id === userId));
        }

        if (deskId !== this.state.deskId) {
            this.onDeskChange(nextProps.desks.find((x) => x._id === deskId));
        }

        if (priorityQcode && priorityQcode !== this.state.priorityQcode) {
            this.onPriorityChange(nextProps.priorities.find((x) => x.qcode === priorityQcode));
        }
    }

    componentDidUpdate(_prevProps, prevState) {
        const currentContactType = this.state.contactType ?? {};
        const prevContactType = prevState.contactType ?? {};

        if (currentContactType.qcode !== prevContactType.qcode) {
            if (currentContactType.assignable) {
                this.onChange(this.FIELDS.USER, null);
            } else {
                this.onChange(this.FIELDS.CONTACT, null);
            }
        }
    }

    onChange(field, value, state: Partial<IState> = {}) {
        const errors = cloneDeep(this.state.errors);
        const combinedState = {
            ...this.state,
            ...state,
        };

        const newState = cloneDeep<IState>(state as IState);

        this.props.onValidate(combinedState, errors);
        newState.errors = errors;
        this.setState(newState);

        // If a field name is provided, then call onChange so
        // the parent can update the field's value
        if (field !== null) {
            this.props.onChange(field, value || null);
        }

        // If there are no errors, then tell our parent the Assignment is valid
        // otherwise, tell the parent the Assignment is invalid
        this.props.setValid(isEqual(errors, {}));
    }

    onUserChange(value) {
        const userId = value?._id;

        if (userId !== this.state.userId) {
            this.onChange(this.FIELDS.USER, userId, {
                userId: userId,
                user: value,
                filteredDesks: getDesksForUser(value, this.props.desks),
            });
        }
    }

    onContactChange(contact) {
        const contactId = contact?._id;

        if (contactId !== this.state.contactId) {
            this.onChange(
                this.FIELDS.CONTACT,
                contactId,
                {contactId: contactId}
            );
        }
    }

    removeContact() {
        this.onChange(this.FIELDS.CONTACT, null, {
            contactId: null,
            contact: null,
        });
    }

    onDeskChange(value) {
        const deskId = value?._id;

        if (deskId !== this.state.deskId) {
            this.onChange(this.FIELDS.DESK, deskId, {
                deskId: deskId,
                desk: value,
                filteredUsers: getUsersForDesk(value, this.props.users),
            });
        }
    }

    onPriorityChange(value) {
        const priorityQcode = value?.qcode;

        if (priorityQcode !== this.state.priorityQcode) {
            this.onChange(this.FIELDS.PRIORITY, priorityQcode, {
                priorityQcode: priorityQcode,
                priority: value,
            });
        }
    }

    setContactTypeAndId(contactTypeQcode) {
        if (!contactTypeQcode) {
            this.setState({
                contactType: null,
                contactId: null,
            });
            return;
        }

        let contactId = this.state.contactId;
        const contactType = this.props.contactTypes.find((x) => x.qcode === contactTypeQcode) ?? null;

        if (this.state.contactType && contactTypeQcode !== this.state.contactType.qcode) {
            contactId = null;
        }

        this.setState({
            contactType,
            contactId,
        });
    }

    onProviderChange(value) {
        const providerQcode = value.qcode;

        if (providerQcode !== this.state.providerQcode) {
            this.setContactTypeAndId(value.contact_type);
            this.onChange(this.FIELDS.PROVIDER, value);
        }
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
        const {SelectUser} = superdeskApi.components;

        return (
            <div className={className}>
                {showDesk && (
                    <Row id="form-row-desk">
                        <SelectInput
                            field={this.FIELDS.DESK}
                            label={gettext('Desk')}
                            value={this.state.desk}
                            onChange={(_field, val) => {
                                this.onDeskChange(val);
                            }}
                            options={this.state.filteredDesks}
                            labelField="name"
                            keyField="_id"
                            clearable={true}
                            readOnly={disableDeskSelection}
                            message={get(this.state, 'errors.desk')}
                            invalid={!!get(this.state, 'errors.desk')}
                            autoFocus
                        />
                    </Row>
                )}

                <Row noPadding={showDesk}>
                    <SelectInput
                        field={this.FIELDS.PROVIDER}
                        label={gettext('Coverage Provider')}
                        value={get(value, this.FIELDS.PROVIDER) ?? null}
                        onChange={(_field, val) => {
                            this.onProviderChange(val);
                        }}
                        options={coverageProviders}
                        labelField="name"
                        keyField="qcode"
                        clearable={true}
                    />
                </Row>

                {this.state.contactType && this.state.contactType.assignable ? (
                    <Row>
                        <Label text={gettext('Assigned Provider')} />
                        {this.state.contactId && (
                            <ContactsPreviewList
                                contactIds={[this.state.contactId]}
                                onRemoveContact={this.removeContact}
                            />
                        )}
                        <SelectSearchContactsField
                            value={this.state.contactId ? [this.state.contactId] : []}
                            onChange={this.onContactChange}
                            contactType={this.state.contactType.qcode}
                            minLengthPopup={0}
                            placeholder={gettext('Search provider contacts')}
                        />
                    </Row>
                ) : (
                    <Row style={{padding: '2rem 0', margin: '0 0 1.8em 0'}}>
                        <div data-test-id={this.FIELDS.USER}>
                            <SelectUser
                                disabled={disableUserSelection}
                                deskId={this.props.value.assigned_to?.desk ?? null}
                                selectedUserId={this.state.userId}
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
                            value={this.state.priority}
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
    contactTypes: getContactTypes(state),
});

const mapDispatchToProps = (dispatch) => ({
    onValidate: (diff, errors) => dispatch(validateItem({
        profileName: ITEM_TYPE.ASSIGNMENT,
        diff: diff,
        errors: errors,
    })),
});

export const AssignmentEditor = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentEditorComponent);
