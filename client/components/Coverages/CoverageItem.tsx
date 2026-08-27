import React from 'react';
import {connect} from 'react-redux';
import {get, isEqual} from 'lodash';

import {IDesk, IUser} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {
    IContactItem,
    IG2ContentType,
    IPlanningCoverageItem,
    IPlanningItem,
    IPlanningWorkflowStatus,
} from '../../interfaces';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {COVERAGES, WORKFLOW_STATE} from '../../constants';
import {
    getCreator,
    getItemInArrayById,
    gettext,
    planningUtils,
} from '../../utils';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';

import {Item, Column, Row, Border, ActionMenu} from '../UI/List';
import {InternalNoteLabel} from '../../components';
import {CoverageIcons} from './CoverageIcons';
import {Label} from 'superdesk-ui-framework/react';

interface IProps {
    coverage: IPlanningCoverageItem;
    users: Array<IUser>;
    desks: Array<IDesk>;
    itemActionComponent?: React.ReactNode;
    contentTypes: Array<IG2ContentType>;
    isPreview?: boolean;
    active?: boolean;
    item: DeepPartial<IPlanningItem>;
    index: number;
    workflowStateReasonPrefix?: string;
    showBackground?: boolean;
    shadow?: number;
    getContactById(contactId: IContactItem['_id']): Promise<IContactItem>;
    onClick?(): void;
}

interface IState {
    addedToWorkflow: boolean;
    userAssigned?: IUser;
    deskAssigned?: IDesk;
    coverageProvider?: string;
    displayContentType?: string;
    coverageDateText?: string;
    internalNoteFieldPrefix?: string;
}

type ILabelType = React.ComponentProps<typeof Label>['type'];

// Statuses without an entry fall back to 'warning'
const WORKFLOW_STATUS_LABEL_TYPES: Partial<Record<IPlanningWorkflowStatus, ILabelType>> = {
    draft: 'default',
    assigned: 'primary',
    active: 'success',
    spiked: 'alert',
};

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
            addedToWorkflow: false,
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
            getUserInterfaceLanguageFromCV();
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
            addedToWorkflow: coverage.workflow_status === COVERAGES.WORKFLOW_STATE.ACTIVE,
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
                <CoverageIcons
                    coverages={[this.props.coverage]}
                    users={this.props.users}
                    desks={this.props.desks}
                    contentTypes={this.props.contentTypes}
                />
            </Column>
        );
    }

    renderFirstRow() {
        return (
            <Row paddingBottom>
                <span
                    className="sd-overflow-ellipsis sd-list-item--element-grow"
                    title={gettext('Coverage type')}
                >
                    {this.state.displayContentType}
                </span>
                <time>
                    <InternalNoteLabel
                        item={this.props.coverage}
                        prefix="planning."
                        marginRight={false}
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
            isPreview,
        } = this.props;

        // Nobody chose to add this coverage to workflow: the server did it on creation, and the
        // action that would have done it by hand is hidden in this state. The status label says
        // "active" instead, which is all there is to say.
        const addedToWorkflowAutomatically = appConfig.planning_auto_assign_to_workflow === true &&
            item.flags?.overide_auto_assign_to_workflow !== true;

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
                    <span
                        className="sd-overflow-ellipsis sd-list-item--element-grow"
                        title={gettext('Desk')}
                    >
                        {isPreview ? null : (
                            <span className="sd-list-item__text-label sd-list-item__text-label--normal">
                                {gettext('Desk: ')}
                            </span>
                        )}
                        {get(this.state.deskAssigned, 'name')}
                    </span>
                )}

                <span className="grid sd-gap--x-small">
                    <InternalNoteLabel
                        item={item}
                        prefix={`${this.state.internalNoteFieldPrefix}.planning.`}
                        noteField="workflow_status_reason"
                        showTooltip={true}
                        stateField = {coverage.workflow_status === WORKFLOW_STATE.CANCELLED ?
                            `${this.state.internalNoteFieldPrefix}.workflow_status` : 'state'}
                        showHeaderText={false}
                    />
                    {(this.state.addedToWorkflow && !addedToWorkflowAutomatically) ? (
                        <Label
                            text={gettext('Added to workflow')}
                            type="success"
                        />
                    ) : (
                        <Label
                            text={coverage.workflow_status}
                            style="hollow"
                            type={WORKFLOW_STATUS_LABEL_TYPES[coverage.workflow_status] ?? 'warning'}
                        />
                    )}
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
                testId="coverage-item"
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
