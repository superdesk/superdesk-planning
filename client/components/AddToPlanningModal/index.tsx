import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {Modal} from '../index';
import {Button} from '../UI';
import {AddToPlanningApp} from '../../apps';

import * as selectors from '../../selectors';
import {gettext} from '../../utils';
import {KEYCODES} from '../../constants';

export class AddToPlanningComponent extends React.Component {
    constructor(props) {
        super(props);

        this.dom = {popupContainer: null};
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown(event) {
        if (event.keyCode === KEYCODES.ESCAPE) {
            event.preventDefault();
            this.props.handleHide();
            this.props.modalProps.$scope.resolve();
        }
    }

    render() {
        const {
            handleHide,
            modalProps,
            currentWorkspace,
            actionInProgress,
        } = this.props;

        const {newsItem, $scope} = modalProps;

        const handleCancel = () => {
            handleHide();
            $scope.resolve();
        };

        if (currentWorkspace !== 'AUTHORING') {
            return null;
        }

        return (
            <Modal
                show={true}
                onHide={handleHide}
                fill={true}
            >
                <Modal.Header>
                    <h3 className="modal__heading">
                        {gettext('Select an existing Planning Item or create a new one')}
                    </h3>
                    {actionInProgress ? null : (
                        <a className="icn-btn" onClick={handleCancel}>
                            <i className="icon-close-small" />
                        </a>
                    )}
                </Modal.Header>

                <Modal.Body noPadding fullHeight noScroll>
                    <div className="planning-app__modal AddToPlanning">
                        <AddToPlanningApp
                            addNewsItemToPlanning={newsItem}
                            popupContainer={() => this.dom.popupContainer}
                            onCancel={handleCancel}
                        />
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        text={gettext('Ignore')}
                        disabled={actionInProgress}
                        onClick={handleCancel}
                    />
                </Modal.Footer>
                <div ref={(node) => this.dom.popupContainer = node} />
            </Modal>
        );
    }
}

AddToPlanningComponent.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        newsItem: PropTypes.object,
        $scope: PropTypes.object,
    }),
    currentWorkspace: PropTypes.string,
    actionInProgress: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    currentWorkspace: selectors.general.currentWorkspace(state),
    actionInProgress: selectors.general.modalActionInProgress(state),
});

export const AddToPlanningModal = connect(
    mapStateToProps,
    null)(AddToPlanningComponent);
