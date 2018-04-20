import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, union} from 'lodash';
import classNames from 'classnames';

import {main} from '../../../actions';

import {ItemMenuPanel} from './ItemMenuPanel';
import {Modal} from '../../index';
import {Editor} from '../index';

import {gettext} from '../../../utils';
import './style.scss';

export class EditorModalComponent extends React.Component {
    constructor(props) {
        super(props);

        this.dom = {popupContainer: null};
        this.state = {
            openItems: [],
            scrollToViewItem: '',
            diff: get(this.props, 'modalProps.item'),
            activeItem: '',
        };

        this.onMenuItemClick = this.onMenuItemClick.bind(this);
        this.onEditorItemChange = this.onEditorItemChange.bind(this);
        this.onItemCloseFromEditor = this.onItemCloseFromEditor.bind(this);
        this.onItemOpenFromEditor = this.onItemOpenFromEditor.bind(this);
        this.onItemFocusFromEditor = this.onItemFocusFromEditor.bind(this);
    }

    componentDidMount() {
        // Open the editor
        this.props.openEditorModal(get(this.props, 'modalProps.item'));
    }

    onMenuItemClick(menuItemName) {
        this.setState({
            openItems: union(this.state.openItems, [menuItemName]),
            scrollToViewItem: menuItemName,
            activeItem: menuItemName,
        });
    }

    onItemCloseFromEditor(menuItemName) {
        this.setState({
            openItems: this.state.openItems.filter((itemName) => itemName !== menuItemName),
            scrollToViewItem: '',
        });
    }

    onItemOpenFromEditor(menuItemName) {
        this.setState({
            openItems: union(this.state.openItems, [menuItemName]),
            scrollToViewItem: '',
            activeItem: menuItemName,
        });
    }

    onItemFocusFromEditor(menuItemName) {
        // Change only if it is a different item to focus
        if (menuItemName !== this.state.activeItem) {
            this.setState({activeItem: menuItemName});
        }
    }

    onEditorItemChange(diff) {
        this.setState({diff: diff});
    }

    render() {
        const navigation = {
            openItems: this.state.openItems,
            scrollToViewItem: this.state.scrollToViewItem,
            onItemOpen: this.onItemOpenFromEditor,
            onItemClose: this.onItemCloseFromEditor,
            onItemFocus: this.onItemFocusFromEditor,
        };

        return (
            <Modal
                show={true}
                onHide={this.props.handleHide}
                xLarge
            >
                <Modal.Header>
                    <h3>{gettext('Editor')}</h3>
                </Modal.Header>

                <Modal.Body noPadding fullHeight noScroll>
                    <div className="editorModal">
                        <div className="editorModal__menu">
                            <ItemMenuPanel
                                item={this.state.diff}
                                onMenuItemClick={this.onMenuItemClick}
                                activeItem={this.state.activeItem} />
                        </div>
                        <div className={classNames(
                            'editorModal__editor',
                            'sd-page-content__content-block',
                            'sd-page-content__content-block--right')}>
                            <Editor
                                className="editorModal__editor--no-full-height"
                                contentClassName="editorModal__editor--content"
                                navigation={navigation}
                                onChange={this.onEditorItemChange}
                                onCancel={this.props.handleHide} />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer />
            </Modal>
        );
    }
}

EditorModalComponent.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.object,
    openEditorModal: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({openEditorModal: (item) => (dispatch(main.openEditorModal(item)))});

export const EditorModal = connect(null, mapDispatchToProps)(EditorModalComponent);
