import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'
import * as actions from '../../actions'
import { AssignmentPreviewContainer, Tabs, Tab } from '../'
import { TOOLTIPS } from '../../constants'
import './style.scss'

export class AssignmentPanel extends React.Component {
    constructor(props) {
        super(props)
        this.tabs = { ASSIGNMENT: 'Assignment' }
        this.state = { activeTab: this.tabs.ASSIGNMENT }
    }

    onChangeTab(tabName) {
        this.setState({ activeTab: tabName })
    }

    render() {
        const {
            closePanel,
            previewOpened,
        } = this.props

        // We render an empty div if previewOpened=false, so the open and close animations occur
        // Otherwise this component will be unmounted before close animation finishes
        return (
            <div className={classNames(
                'sd-preview-panel',
                { hidden: !previewOpened },
                { AssignmentPanelContainer: previewOpened }
            )}>
                {previewOpened &&
                    <div className="side-panel side-panel--shadow-right">
                        <div className="side-panel__header">
                            <div
                                className="side-panel__tools"
                                onClick={closePanel}
                                data-sd-tooltip={TOOLTIPS.close}
                                data-flow="bottom"
                            >
                                <a className="icn-btn" data-flow="top">
                                    <i className="icon-close-small" />
                                </a>
                            </div>
                            <Tabs>
                                <Tab
                                    tabName={this.tabs.ASSIGNMENT}
                                    activeTab={this.state.activeTab}
                                    onChangeTab={this.onChangeTab.bind(this, this.tabs.ASSIGNMENT)}
                                    key={'assignment-preview-' + this.tabs.ASSIGNMENT}
                                />
                            </Tabs>
                        </div>
                        <div className="side-panel__content">
                            {this.state.activeTab === this.tabs.ASSIGNMENT && (
                                <AssignmentPreviewContainer />
                            )}
                        </div>
                    </div>
                }
            </div>
        )
    }
}

AssignmentPanel.propTypes = {
    closePanel: PropTypes.func.isRequired,
    previewOpened: PropTypes.bool,
}

const mapDispatchToProps = (dispatch) => ({ closePanel: () => dispatch(actions.assignments.ui.closePreview()) })

export const AssignmentPanelContainer = connect(
    null,
    mapDispatchToProps
)(AssignmentPanel)
