import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {planningApi} from '../../superdeskApi';
import {TOOLTIPS} from '../../constants';
import {gettext, assignmentUtils, lockUtils} from '../../utils';
import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {Tabs} from '../../components/UI/Nav';
import {SidePanel, Header, Tools, Content} from '../../components/UI/SidePanel';
import {LockContainer} from '../../components/';
import {ArchivePreview} from '../../components/Archive';
import {AssignmentPreviewContainer, AssignmentHistory} from '../../components/Assignments';
import {IPreviewTab, IPreviewTool} from '../../interfaces';

const TABS = {
    ASSIGNMENT: 0,
    CONTENT: 1,
    HISTORY: 2,
};

export class AssignmentPreviewComponent extends React.Component {
    tools: Array<IPreviewTool>;
    tabs: Array<IPreviewTab>;

    constructor(props) {
        super(props);
        this.state = {tab: TABS[props.initialTab] || TABS.ASSIGNMENT};

        this.setActiveTab = this.setActiveTab.bind(this);
        this.closePanel = this.closePanel.bind(this);
        this.onUnlock = this.onUnlock.bind(this);

        this.tools = [{
            icon: 'close-small',
            onClick: props.closePanel,
            title: gettext(TOOLTIPS.close),
        }];

        this.tabs = [{
            label: gettext('Assignment'),
            render: AssignmentPreviewContainer,
            enabled: true,
            tabProps: {
                hideItemActions: this.props.hideItemActions,
                showFulfilAssignment: this.props.showFulfilAssignment,
            },
        }, {
            label: gettext('Content'),
            render: ArchivePreview,
            enabled: false,
        }, {
            label: gettext('Item History'),
            render: AssignmentHistory,
            enabled: true,
        }];
    }

    componentWillMount() {
        // If the Assignment has content, enable the CONTENT tab
        this.tabs[1].enabled = assignmentUtils.assignmentHasContent(this.props.assignment);
    }

    componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any) {
        if (prevProps.assignment?._id !== this.props.assignment?._id) {
            // When changing Assignment items,  if the new Assignment has content
            // Then enable the CONTENT tab
            this.tabs[TABS.CONTENT].enabled = assignmentUtils.assignmentHasContent(this.props.assignment);
        }
        if (prevProps.initialTab !== this.props.initialTab) {
            this.setActiveTab(TABS[this.props.initialTab] || TABS.ASSIGNMENT);
        }
    }

    setActiveTab(tab) {
        this.setState({tab});
    }

    closePanel() {
        // When closing the panel, change the tab to the ASSIGNMENT tab
        this.props.closePanel();
        this.setActiveTab(TABS.ASSIGNMENT);
    }

    onUnlock() {
        planningApi.locks.unlockItem(this.props.assignment);
    }

    render() {
        const {
            assignment,
            users,
            lockedItems,
        } = this.props;

        const lockedUser = lockUtils.getLockedUser(assignment, lockedItems, users);
        const lockAction = get(assignment, 'lock_action');
        const hasContent = assignmentUtils.assignmentHasContent(assignment);

        // If the selected tab is CONTENT but the current assignment is not linked to an item
        // then show the ASSIGNMENT tab, otherwise show the selected tab
        const currentTabIndex = (!hasContent && this.state.tab === TABS.CONTENT) ?
            TABS.ASSIGNMENT :
            this.state.tab;
        const currentTab = this.tabs[currentTabIndex];
        const RenderTab = currentTab.render;

        return (
            <SidePanel shadowRight={true} bg00={true}>
                <Header>
                    <Tools tools={this.tools} />

                    {lockedUser && (
                        <div className="nav-tabs nav-tabs--no-grow">
                            <LockContainer
                                lockedUser={lockedUser}
                                users={users}
                                displayText={lockAction === 'content_edit' ?
                                    gettext('Content locked') :
                                    gettext('Assignment locked')
                                }
                                showUnlock={lockAction !== 'content_edit'}
                                onUnlock={this.onUnlock}
                            />
                        </div>
                    )}

                    <Tabs
                        tabs={this.tabs}
                        active={currentTabIndex}
                        setActive={this.setActiveTab}
                    />
                </Header>
                {assignment && (
                    <Content>
                        <RenderTab {...currentTab.tabProps} />
                    </Content>
                )}
            </SidePanel>
        );
    }
}

AssignmentPreviewComponent.propTypes = {
    closePanel: PropTypes.func.isRequired,
    previewOpened: PropTypes.bool,
    assignment: PropTypes.object,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    lockedItems: PropTypes.object,
    hideItemActions: PropTypes.bool,
    showFulfilAssignment: PropTypes.bool,
    initialTab: PropTypes.string,
};

const mapStateToProps = (state) => ({
    assignment: selectors.getCurrentAssignment(state),
    users: selectors.general.users(state),
    previewOpened: selectors.getPreviewAssignmentOpened(state),
    lockedItems: selectors.locks.getLockedItems(state),
    initialTab: selectors.getInitialTab(state),
});

const mapDispatchToProps = (dispatch) => ({
    closePanel: () => dispatch(actions.assignments.ui.closePreview()),
});

export const AssignmentPreview = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentPreviewComponent);
