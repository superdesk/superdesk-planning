import React from 'react';
import {get, union} from 'lodash';
import classNames from 'classnames';

import {ITEM_TYPE, KEYCODES, UI} from '../../../constants';
import {Modal} from '../../index';
import {EditorModal} from '../index';
import {EditorComponent} from '../ItemEditor';

import {getItemType, gettext, isExistingItem, onEventCapture} from '../../../utils';
import './style.scss';
import {EDITOR_TYPE, IEventOrPlanningItem} from '../../../interfaces';
import {EditorBookmarksBar} from '../../Editor/EditorBookmarksBar';
import {planningApi} from '../../../superdeskApi';

interface IProps {
    initialValues: DeepPartial<IEventOrPlanningItem>;
}

interface IState {
    openItems: Array<any>;
    scrollToViewItem: string;
    diff: DeepPartial<IEventOrPlanningItem>;
    activeItem: string;
    currentTab: number;
}

export class EditorModalPanel extends React.Component<IProps, IState> {
    dom: {
        menu: React.RefObject<HTMLDivElement>;
        editor: React.RefObject<EditorComponent>;
    };

    constructor(props) {
        super(props);

        this.state = {
            openItems: [],
            scrollToViewItem: '',
            diff: get(this.props, 'initialValues'),
            activeItem: '',
            currentTab: UI.EDITOR.CONTENT_TAB_INDEX,
        };

        this.dom = {
            menu: React.createRef<HTMLDivElement>(),
            editor: React.createRef<EditorComponent>(),
        };

        this.onMenuItemClick = this.onMenuItemClick.bind(this);
        this.onEditorItemChange = this.onEditorItemChange.bind(this);
        this.onItemCloseFromEditor = this.onItemCloseFromEditor.bind(this);
        this.onItemOpenFromEditor = this.onItemOpenFromEditor.bind(this);
        this.onItemFocusFromEditor = this.onItemFocusFromEditor.bind(this);
        this.onDragEvents = this.onDragEvents.bind(this);
        this.onEditorTabChange = this.onEditorTabChange.bind(this);
        this.onCloseModal = this.onCloseModal.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    onDragEvents(e) {
        e.preventDefault();
        if (e.target.className.indexOf('basic-drag-block') < 0) {
            e.dataTransfer.effectAllowed = 'none';
            e.dataTransfer.dropEffect = 'none';
        }
    }

    componentDidMount() {
        window.addEventListener('dragover', this.onDragEvents);
        window.addEventListener('drop', this.onDragEvents);
        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount() {
        window.removeEventListener('dragover', this.onDragEvents);
        window.removeEventListener('drop', this.onDragEvents);
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown(event) {
        if (event.keyCode === KEYCODES.ESCAPE) {
            event.preventDefault();
            this.dom.editor.current?.cancelFromHeader();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.activeItem !== this.state.activeItem &&
            (this.state.activeItem === 'event' || this.state.activeItem === 'planning') &&
            this.dom.menu.current != null
        ) {
            this.dom.menu.current.scrollTop = 0;
        }
    }

    onCloseModal() {
        this.dom.editor.current?.cancelFromHeader();
    }

    onMenuItemClick(menuItemName) {
        // Change tab to content
        if (this.state.currentTab !== UI.EDITOR.CONTENT_TAB_INDEX) {
            this.dom.editor.current?.setActiveTab(UI.EDITOR.CONTENT_TAB_INDEX);
        }

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

    onItemFocusFromEditor(menuItemName, event) {
        onEventCapture(event);
        // Change only if it is a different item to focus
        if (menuItemName !== this.state.activeItem) {
            this.setState({activeItem: menuItemName});
        }
    }

    onEditorItemChange(diff) {
        this.setState({diff: diff});
    }

    onEditorTabChange(tab) {
        let newState: Partial<IState> = {currentTab: tab};

        if (tab !== UI.EDITOR.CONTENT_TAB_INDEX) {
            newState = {
                ...newState,
                openItems: [],
                scrollToViewItem: '',
                activeItem: '',
            };
        }
        this.setState(newState);
    }

    render() {
        const itemType = getItemType(get(this.props, 'initialValues'));
        const navigation = {
            padContentForNavigation: itemType === ITEM_TYPE.EVENT,
            openItems: this.state.openItems,
            scrollToViewItem: this.state.scrollToViewItem,
            onItemOpen: this.onItemOpenFromEditor,
            onItemClose: this.onItemCloseFromEditor,
            onItemFocus: this.onItemFocusFromEditor,
            onTabChange: this.onEditorTabChange,
        };
        const modalTitle = gettext('{{action}} {{type}}', {
            action: isExistingItem(get(this.props, 'initialValues')) ?
                gettext('Edit') : gettext('Create'),
            type: itemType === ITEM_TYPE.EVENT ? gettext('Event') : gettext('Planning'),
        });

        return ([
            <Modal.Header key="modal-header">
                <h3 className="modal__heading">{modalTitle}</h3>
                <a className="icn-btn" aria-label={gettext('Close')} onClick={this.onCloseModal}>
                    <i className="icon-close-small" />
                </a>
            </Modal.Header>,

            <Modal.Body noPadding fullHeight noScroll key="modal-body">
                <div className="editorModal">
                    <div
                        className="editorModal__menu"
                        ref={this.dom.menu}
                    >
                        <EditorBookmarksBar editorType={EDITOR_TYPE.POPUP} />
                    </div>
                    <div
                        className={classNames(
                            'editorModal__editor',
                            'sd-page-content__content-block',
                            'sd-page-content__content-block--right'
                        )}
                        onScroll={planningApi.editor(EDITOR_TYPE.POPUP).events.onScroll}
                    >
                        <EditorModal
                            navigation={navigation}
                            onChange={this.onEditorItemChange}
                            hideMinimize
                            hideExternalEdit
                            ref={this.dom.editor}
                        />
                    </div>
                </div>
            </Modal.Body>,
        ]);
    }
}
