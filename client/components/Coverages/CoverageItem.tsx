import React from 'react';
import {connect} from 'react-redux';
import {get, isEqual} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {IDesk, IUser} from 'superdesk-api';
import {IContactItem, IG2ContentType, IPlanningCoverageItem, IPlanningItem} from '../../interfaces';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {WORKFLOW_STATE} from '../../constants';
import {
    getCreator,
    getItemInArrayById,
    gettext,
    planningUtils,
} from '../../utils';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';

import {Item, Column, Row, Border, ActionMenu} from '../UI/List';
import {StateLabel, InternalNoteLabel} from '../../components';
import {CoverageIcon} from './CoverageIcon';
import {UserAvatar} from '../UserAvatar';

interface IProps {
    coverage: IPlanningCoverageItem;
    users: Array<IUser>;
    desks: Array<IDesk>;
    itemActionComponent: React.ReactNode;
    contentTypes: Array<IG2ContentType>;
    isPreview?: boolean;
    active?: boolean;
    item: DeepPartial<IPlanningItem>;
    index: number;
    workflowStateReasonPrefix?: string;
    showBackground: boolean;
    shadow?: number;
    getContactById(contactId: IContactItem['_id']): Promise<IContactItem>;
    onClick?(): void;
}

interface IState {
    userAssigned?: IUser;
    deskAssigned?: IDesk;
    coverageProvider?: string;
    displayContentType?: string;
    coverageDateText?: string;
    internalNoteFieldPrefix?: string;
    coverageInWorkflow?: boolean;
}

const mapStateToProps = (state) => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    contentTypes: selectors.general.contentTypes(state),
});

const mapDispatchToProps = (dispatch) => ({
    getContactById: (contactId) => dispatch(actions.contacts.getContactById(contactId)),
});

export class CoverageItemComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            userAssigned: null,
            deskAssigned: null,
            coverageProvider: '',
            displayContentType: '',
            coverageDateText: '',
            internalNoteFieldPrefix: '',
            coverageInWorkflow: false,
        };

        this.updateViewAttributes = this.updateViewAttributes.bind(this);
    }

    componentDidMount() {
        this.updateViewAttributes(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (!isEqual(nextProps.coverage, this.props.coverage)) {
            this.updateViewAttributes(nextProps);
        }
    }

    loadContactInformation(props) {
        if (get(props, 'coverage.assigned_to.contact')) {
            this.props.getContactById(props.coverage.assigned_to.contact)
                .then((contact) => {
                    this.setState({
                        coverageProvider: `${contact.last_name}, ${contact.first_name}`,
                    });
                });
        }
    }

    updateViewAttributes(props: IProps) {
        const {
            isPreview,
            coverage,
            users,
            desks,
            workflowStateReasonPrefix,
            index,
            item,
        } = props;
        const language = coverage.planning?.language ??
            item.language ??
            getUserInterfaceLanguage();
        const genre = getVocabularyItemFieldTranslated(
            coverage.planning?.genre,
            'name',
            language,
        );
        const coverageDate = get(coverage, 'planning.scheduled');

        const newState: Partial<IState> = {
            userAssigned: null,
            displayContentType: '',
            coverageDateText: '',
        };

        if (!isPreview) {
            newState.userAssigned = getCreator(
                coverage,
                'assigned_to.user',
                users
            ) as IUser;
        }

        newState.deskAssigned = getItemInArrayById(
            desks,
            get(coverage, 'assigned_to.desk')
        );
        newState.displayContentType = getVocabularyItemFieldTranslated(
            this.props.contentTypes.find(
                (type) => type.qcode === coverage.planning?.g2_content_type,
            ),
            'name',
            language,
        ) ?? '';

        if (genre) {
            newState.displayContentType += `/${genre}`;
        }

        newState.coverageDateText = !coverageDate ?
            gettext('Not scheduled yet') :
            planningUtils.getCoverageDateTimeText(coverage);

        newState.internalNoteFieldPrefix = workflowStateReasonPrefix || `coverages[${index}]`;
        newState.coverageInWorkflow = planningUtils.isCoverageInWorkflow(coverage);
        newState.coverageProvider = get(coverage, 'assigned_to.coverage_provider.name', '');

        this.setState(newState);
        this.loadContactInformation(props);
    }

    renderAvatar() {
        if (this.props.isPreview) {
            return null;
        }

        return (
            <Column border={false}>
                {this.state.userAssigned ? (
                    <UserAvatar
                        user={this.state.userAssigned}
                        small={false}
                        showInactive
                    />
                ) : (
                    <UserAvatar
                        empty={true}
                        noMargin={true}
                        initials={false}
                        small={false}
                    />
                )}
            </Column>
        );
    }

    renderFirstRow() {
        return (
            <Row paddingBottom>
                <CoverageIcon
                    coverage={this.props.coverage}
                    users={this.props.users}
                    desks={this.props.desks}
                    contentTypes={this.props.contentTypes}
                />
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                    {this.state.displayContentType}
                </span>
                <time>
                    <InternalNoteLabel
                        item={this.props.coverage}
                        prefix="planning."
                        marginRight={true}
                    />
                    <i className="icon-time" />
                    {this.state.coverageDateText}
                </time>
            </Row>
        );
    }

    renderSecondRow() {
        const {
            coverage,
            item,
        } = this.props;

        return (
            <Row>
                {!this.state.userAssigned && !this.state.deskAssigned && (
                    <span
                        className="sd-list-item__text-label sd-list-item__text-label--normal
                        sd-overflow-ellipsis sd-list-item--element-grow"
                    >
                        {gettext('Unassigned')}
                    </span>
                )}

                {this.state.deskAssigned && (
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                            {gettext('Desk: ')}
                        </span>
                        {get(this.state.deskAssigned, 'name')}
                    </span>
                )}

                <span className="grid">
                    <InternalNoteLabel
                        item={item}
                        prefix={`${this.state.internalNoteFieldPrefix}.planning.`}
                        noteField="workflow_status_reason"
                        showTooltip={true}
                        stateField = {coverage.workflow_status === WORKFLOW_STATE.CANCELLED ?
                            `${this.state.internalNoteFieldPrefix}.workflow_status` : 'state'}
                        showHeaderText={false}
                    />
                    <StateLabel
                        item={this.state.coverageInWorkflow ? get(coverage, 'assigned_to', {}) : coverage}
                        fieldName={this.state.coverageInWorkflow ? 'state' : 'workflow_status'}
                    />
                </span>
            </Row>
        );
    }

    renderThirdRow() {
        return (
            <Row>
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                    {this.state.userAssigned && (
                        <span>
                            <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                {gettext('Assignee: ')}
                            </span>
                            {get(this.state.userAssigned, 'display_name', '')}
                        </span>
                    )}
                    {this.state.coverageProvider && (
                        <span>
                            <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                {gettext('Provider: ')}
                            </span>
                            {this.state.coverageProvider}
                        </span>
                    )}
                </span>
            </Row>
        );
    }

    render() {
        const {itemActionComponent, active, showBackground, shadow, onClick} = this.props;

        return (
            <Item
                noBg={!showBackground && !active}
                activated={active}
                shadow={shadow}
                onClick={onClick}
            >
                <Border />
                {this.renderAvatar()}
                <Column grow={true} border={false}>
                    {this.renderFirstRow()}
                    {this.renderSecondRow()}
                    {this.renderThirdRow()}
                </Column>
                {itemActionComponent && (
                    <ActionMenu>
                        {itemActionComponent}
                    </ActionMenu>
                )}
            </Item>
        );
    }
}

export const CoverageItem = connect(
    mapStateToProps,
    mapDispatchToProps
)(CoverageItemComponent);
