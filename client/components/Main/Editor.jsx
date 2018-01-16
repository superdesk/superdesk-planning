import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, set, isEqual, cloneDeep} from 'lodash';
import {gettext} from '../../utils';

import {ITEM_TYPE} from '../../constants';
import * as actions from '../../actions';

import {
    HistoryTab,
    EditorContentTab
} from './';

import {Tabs as NavTabs} from '../UI/Nav';
import {SidePanel, Content} from '../UI/SidePanel';

import {EditorHeader} from './EditorHeader';

export class EditorComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: 0,
            diff: {},
            dirty: false,
            submitting: false,
        };
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onPublish = this.onPublish.bind(this);
        this.onSaveAndPublish = this.onSaveAndPublish.bind(this);
        this.onUnpublish = this.onUnpublish.bind(this);

        this.tabs = [
            {label: gettext('Content'), render: EditorContentTab, enabled: true},
            {label: gettext('History'), render: HistoryTab, enabled: true},
        ];
    }

    componentWillReceiveProps(nextProps) {
        if (!get(nextProps, 'item') && get(nextProps, 'itemType') && !get(this.props, 'itemType')) {
            let diff = {_type: nextProps.itemType};

            if (nextProps.itemType === ITEM_TYPE.EVENT) {
                diff.dates = {};
            }

            this.setState({
                diff: diff,
                dirty: false,
                submitting: false,
            });
        } else if (get(nextProps, 'item._id') !== get(this.props, 'item._id')) {
            const diff = cloneDeep(get(nextProps, 'item') || {});

            this.setState({
                diff: diff,
                dirty: false,
                submitting: false
            });
        } else if (!isEqual(
            get(nextProps, 'item'),
            get(this.props, 'item')
        )) {
            const diff = cloneDeep(get(nextProps, 'item') || {});

            this.setState({
                diff: diff,
                dirty: false,
                submitting: false
            });
        }

        this.tabs[1].enabled = !!get(nextProps, 'item._id');
    }

    onChangeHandler(field, value) {
        const diff = Object.assign({}, this.state.diff);

        set(diff, field, value);

        this.setState({
            diff: diff,
            dirty: !isEqual(this.props.item, diff)
        });
    }

    onSave() {
        this.setState({submitting: true});
        return this.props.onSave(this.state.diff, true, false);
    }

    onPublish() {
        this.setState({submitting: true});
        return this.props.onSave(this.state.diff, false, true);
    }

    onSaveAndPublish() {
        this.setState({submitting: true});
        return this.props.onSave(this.state.diff, true, true);
    }

    onUnpublish() {
        this.setState({submitting: true});
        return this.props.onUnpublish(this.state.diff);
    }

    setActiveTab(tab) {
        this.setState({tab});
    }

    render() {
        if (!this.props.itemType) {
            return null;
        }

        const RenderTab = this.tabs[this.state.tab].render;

        // Do not show the tabs if we're creating a new item
        const existingItem = !!this.props.item;

        return (
            <SidePanel shadowRight={true}>
                <EditorHeader
                    item={this.props.item}
                    onSave={this.onSave}
                    onPublish={this.onPublish}
                    onSaveAndPublish={this.onSaveAndPublish}
                    onUnpublish={this.onUnpublish}
                    cancel={this.props.cancel}
                    minimize={this.props.minimize}
                    submitting={this.state.submitting}
                    dirty={this.state.dirty}
                    session={this.props.session}
                    privileges={this.props.privileges}
                    lockedItems={this.props.lockedItems}
                    openCancelModal={this.props.openCancelModal}
                />
                <Content flex={true}>
                    {existingItem && (
                        <NavTabs
                            tabs={this.tabs}
                            active={this.state.tab}
                            setActive={this.setActiveTab}
                            className="side-panel__content-tab-nav"
                        />
                    )}
                    <div className="side-panel__content-tab-content">
                        <RenderTab
                            item={this.props.item}
                            itemType={this.props.itemType}
                            diff={this.state.diff}
                            onChangeHandler={this.onChangeHandler}
                        />
                    </div>
                </Content>
            </SidePanel>
        );
    }
}

EditorComponent.propTypes = {
    item: PropTypes.object,
    itemType: PropTypes.string,
    cancel: PropTypes.func.isRequired,
    minimize: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onUnpublish: PropTypes.func.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    lockedItems: PropTypes.object,
    openCancelModal: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
    minimize: () => dispatch(actions.main.cancel()),
});

export const Editor = connect(null, mapDispatchToProps)(EditorComponent);
