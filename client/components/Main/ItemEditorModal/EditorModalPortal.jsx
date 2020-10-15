import React from 'react';
import PropTypes from 'prop-types';
import {Portal} from 'react-portal';
import {connect} from 'react-redux';

import {EditorModalPanel} from './EditorModalPanel';
import Draggable from 'react-draggable';

import {currentItemIdModal, currentItemTypeModal, initialValuesModal} from '../../../selectors/forms';
import {modalType} from '../../../selectors/general';
import {main} from '../../../actions';


class PopupEditorPortalComponent extends React.Component {
    render() {
        const {initialValues, itemId, itemType, handleHide, modalType} = this.props;

        if (!itemType || !itemId) {
            return null;
        }

        return (
            <Portal>
                <div role="dialog" style={{display: modalType ? 'none' : 'block'}}>
                    <Draggable handle=".modal__header">
                        <div
                            role="dialog"
                            tabIndex="-1"
                            className="fade modal modal--x-large in modal--draggable"
                            style={{display: 'block'}}
                        >
                            <div className="modal__dialog--full-height modal__dialog">
                                <div className="modal__content" role="document">
                                    <EditorModalPanel
                                        handleHide={handleHide}
                                        initialValues={initialValues}
                                    />
                                </div>
                            </div>
                        </div>
                    </Draggable>
                </div>
            </Portal>
        );
    }
}

PopupEditorPortalComponent.propTypes = {
    modalType: PropTypes.string,
    handleHide: PropTypes.func.isRequired,
    initialValues: PropTypes.object,
    itemId: PropTypes.string,
    itemType: PropTypes.string,
};

const mapStateToProps = (state) => ({
    modalType: modalType(state),
    initialValues: initialValuesModal(state),
    itemId: currentItemIdModal(state),
    itemType: currentItemTypeModal(state),
});

const mapDispatchToProps = (dispatch) => ({
    handleHide: () => dispatch(main.closeEditor(true)),
});

export const PopupEditorPortal = connect(
    mapStateToProps,
    mapDispatchToProps
)(PopupEditorPortalComponent);
