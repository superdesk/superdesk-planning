import React from 'react';
import PropTypes from 'prop-types';
import { gettext } from '../utils';

import NavTabs from './NavTabs';
import HistoryTab from './HistoryTab';
import EditorContentTab from './EditorContentTab';

class Editor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tab: 0};
    }

    render() {
        const tabs = [
            {label: gettext('Content'), render: EditorContentTab},
            {label: gettext('History'), render: HistoryTab},
        ];

        const RenderTab = tabs[this.state.tab].render;

        return (
            <div className="side-panel side-panel--shadow-right">
                <div className="side-panel__header subnav">
                    <div className="subnav__stretch-bar">
                        <figure className="avatar" style={{marginRight: 10}}>{'sd'}</figure>
                    </div>
                    <div className="subnav__stretch-bar subnav__stretch-bar--right">
                        <button className="btn" onClick={this.props.cancel}>{gettext('Cancel')}</button>
                        <button className="btn btn--success">{gettext('Publish')}</button>
                        <button className="btn btn--primary">{gettext('Save')}</button>
                    </div>
                    <button className="navbtn" onClick={this.props.minimize}>
                        <i className="big-icon--minimize" />
                    </button>
                    <button className="navbtn">
                        <i className="icon-dots-vertical" />
                    </button>
                </div>
                <div className="side-panel__content side-panel__content--flex">
                    <NavTabs
                        tabs={tabs}
                        active={this.state.tab}
                        setActive={(tab) => this.setState({tab})}
                        className="side-panel__content-tab-nav"
                    />
                    {this.props.item && (
                        <div className="side-panel__content-tab-content">
                            <div className="side-panel__content-block">
                                <RenderTab item={this.props.item} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

Editor.propTypes = {
    item: PropTypes.object,
    cancel: PropTypes.func.isRequired,
    minimize: PropTypes.func.isRequired,
};

export default Editor;
