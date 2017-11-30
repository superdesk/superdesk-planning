import React from 'react';
import PropTypes from 'prop-types';
import {Button} from 'react-bootstrap';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';

import Modal from '../Modal';
import {gettext} from '../../utils';

import './style.scss';

const SortableItem = SortableElement(({label}) =>
    <li className="sortable-list__item draggable-list__item">{label}</li>
);

const SortableList = SortableContainer(({items}) =>
    <ul className="sortable-list">
        {items.map((item, index) =>
            <SortableItem key={item.id} index={index} label={item.label} />
        )}
    </ul>
);

class SortItemsModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {items: this.props.modalProps.items};
        this.done = this.done.bind(this);
        this.onSortEnd = this.onSortEnd.bind(this);
        this.onSortStart = this.onSortStart.bind(this);
    }

    done() {
        this.props.modalProps.action(this.state.items);
        this.props.handleHide();
    }

    onSortEnd({oldIndex, newIndex}) {
        this.setState({items: arrayMove(this.state.items, oldIndex, newIndex)});
        document.body.style.cursor = this.cursor;
    }

    // set cursor to move during whole drag
    onSortStart() {
        this.cursor = document.body.style.cursor;
        document.body.style.cursor = 'move';
    }

    render() {
        return (
            <Modal show={true}>
                <Modal.Header>
                    <h3>{gettext('Reorder Items')}</h3>
                </Modal.Header>
                <Modal.Body>
                    <SortableList items={this.state.items}
                        onSortEnd={this.onSortEnd}
                        onSortStart={this.onSortStart}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button"
                        onClick={this.props.handleHide}>{gettext('Cancel')}</Button>
                    <Button type="submit" className="btn--primary"
                        onClick={this.done}>{gettext('Done')}</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

SortItemsModal.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        action: PropTypes.func.isRequired,
        items: PropTypes.array.isRequired,
    }),
};

export default SortItemsModal;