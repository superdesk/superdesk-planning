import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from '../utils';

import NavTabs from './NavTabs';
import HistoryTab from './HistoryTab';
import EditorContentTab from './EditorContentTab';

class Editor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tab: 0, diff: null, dirty: false};
        this.onChangeHandler = this.onChangeHandler.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (get(nextProps, 'item._id') !== get(this.props, 'item._id')) {
            const diff = Object.assign({}, nextProps.item);

            this.setState({diff: diff, dirty: false});
        }
    }

    onChangeHandler(field) {
        return (event) => {
            const diff = Object.assign({}, this.state.diff);

            diff[field] = event.target.value;
            this.setState({diff: diff, dirty: true});
        };
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
                        <button className="btn btn--primary" disabled={!this.state.dirty}>
                            {gettext('Save')}
                        </button>
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
                                <RenderTab
                                    item={this.props.item}
                                    diff={this.state.diff}
                                    onChangeHandler={this.onChangeHandler}
                                />
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
