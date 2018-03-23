import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classNames from 'classnames';
import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {AssignmentPreviewContainer, ArchivePreview, Tabs, Tab, LockContainer, AssignmentHistory} from '../';
import {TOOLTIPS} from '../../constants';
import {assignmentUtils} from '../../utils';
import {get} from 'lodash';
import './style.scss';

export class AssignmentPanel extends React.Component {
    constructor(props) {
        super(props);
        this.tabs = {
            ASSIGNMENT: 'Assignment',
            CONTENT: 'Content',
            HISTORY: 'Item History',
        };
        this.state = {activeTab: this.tabs.ASSIGNMENT};
        this.closePanel = this.closePanel.bind(this);
    }

    closePanel() {
        // When closing the panel, change the tab to the ASSIGNMENT tab
        this.props.closePanel();
        this.onChangeTab(this.tabs.ASSIGNMENT);
    }

    onChangeTab(tabName) {
        this.setState({activeTab: tabName});
    }

    render() {
        const {
            previewOpened,
            assignment,
            users,
            unlockAssignment,
            inAuthoring,
        } = this.props;

        const hasContent = assignmentUtils.assignmentHasContent(assignment);
        const lockedUser = get(assignment, 'lock_user');

        // If the selected tab is CONTENT but the current assignment is not linked to an item
        // then show the ASSIGNMENT tab, otherwise show the selected tab
        const currentTab = (!hasContent && this.state.activeTab === this.tabs.CONTENT) ?
            this.tabs.ASSIGNMENT : this.state.activeTab;

        // We render an empty div if previewOpened=false, so the open and close animations occur
        // Otherwise this component will be unmounted before close animation finishes
        return (
            <div className={classNames(
                'sd-preview-panel',
                'content-item-preview',
                {
                    hidden: !previewOpened,
                    AssignmentPanelContainer: previewOpened,
                    'AssignmentPanelContainer--in-authoring': previewOpened && inAuthoring
                }
            )}>
                {previewOpened &&
                    <div className="side-panel side-panel--shadow-right">
                        <div className="side-panel__header">
                            <div
                                className="side-panel__tools"
                                onClick={this.closePanel}
                                data-sd-tooltip={TOOLTIPS.close}
                                data-flow="bottom"
                            >
                                <a className="icn-btn" data-flow="top">
                                    <i className="icon-close-small" />
                                </a>
                            </div>
                            {get(assignment, 'lock_user') &&
                                <div className="AssignmentPanelContainer__lock-user nav-tabs">
                                    <LockContainer
                                        lockedUser={lockedUser}
                                        users={users}
                                        displayText={get(assignment, 'lock_action') === 'content_edit' ?
                                            'Content locked' :
                                            'Assignment locked'
                                        }
                                        showUnlock={get(assignment, 'lock_action') !== 'content_edit'}
                                        withLoggedInfo={true}
                                        onUnlock={unlockAssignment.bind(null, assignment)}
                                    />
                                </div>
                            }
                            <Tabs>
                                <Tab
                                    tabName={this.tabs.ASSIGNMENT}
                                    activeTab={currentTab}
                                    onChangeTab={this.onChangeTab.bind(this, this.tabs.ASSIGNMENT)}
                                    key={'assignment-preview-' + this.tabs.ASSIGNMENT}
                                />
                                {hasContent &&
                                    <Tab
                                        tabName={this.tabs.CONTENT}
                                        activeTab={currentTab}
                                        onChangeTab={this.onChangeTab.bind(this, this.tabs.CONTENT)}
                                        key={'assignment-preview-' + this.tabs.CONTENT}
                                    />
                                }
                                <Tab
                                    tabName={this.tabs.HISTORY}
                                    activeTab={currentTab}
                                    onChangeTab={this.onChangeTab.bind(this, this.tabs.HISTORY)}
                                    key={'assignment-preview-' + this.tabs.HISTORY}
                                />
                            </Tabs>
                        </div>
                        <div className="side-panel__content">
                            {currentTab === this.tabs.ASSIGNMENT && (
                                <AssignmentPreviewContainer />
                            )}
                            {currentTab === this.tabs.CONTENT &&
                                <ArchivePreview />
                            }
                            {currentTab === this.tabs.HISTORY &&
                                <AssignmentHistory />
                            }
                        </div>
                    </div>
                }
            </div>
        );
    }
}

AssignmentPanel.propTypes = {
    closePanel: PropTypes.func.isRequired,
    previewOpened: PropTypes.bool,
    assignment: PropTypes.object,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    unlockAssignment: PropTypes.func,
    inAuthoring: PropTypes.bool,
};

AssignmentPanel.defaultProps = {inAuthoring: false};

const mapStateToProps = (state) => ({
    assignment: selectors.getCurrentAssignment(state),
    users: selectors.getUsers(state),
});

const mapDispatchToProps = (dispatch) => ({
    closePanel: () => dispatch(actions.assignments.ui.closePreview()),
    unlockAssignment: (assignment) => dispatch(actions.assignments.ui.unlockAssignment(assignment)),
});

export const AssignmentPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentPanel);
