import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {Button} from '../UI';

import {Modal} from '../index';
import {FulfilAssignmentApp} from '../../apps';

import * as selectors from '../../selectors';
import {WORKSPACE, KEYCODES} from '../../constants';
import {gettext} from '../../utils';


class FulFilAssignmentComponent extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
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
            this.handleCancel();
        }
    }

    handleCancel() {
        this.props.handleHide();

        if (this.props.modalProps.onCancel) {
            this.props.modalProps.onCancel();
        }
    }

    render() {
        const {
            handleHide,
            modalProps,
            currentWorkspace,
            actionInProgress} = this.props;

        if (currentWorkspace !== WORKSPACE.AUTHORING) {
            return null;
        }

        const {newsItem, onIgnore, showIgnore, ignoreText, title} = modalProps;
        const showCancel = get(modalProps, 'showCancel', true);


        const handleIgnore = !showIgnore ? null : () => {
            handleHide();

            if (onIgnore) {
                onIgnore();
            }
        };

        return (
            <Modal
                show={true}
                onHide={handleHide}
                fill={true}
            >
                <Modal.Header>
                    <h3 className="modal__heading">{title || gettext('Select an Assignment')}</h3>
                    {actionInProgress ? null : (
                        <a className="icn-btn" aria-label={gettext('Close')} onClick={this.handleCancel}>
                            <i className="icon-close-small" />
                        </a>
                    )}
                </Modal.Header>

                <Modal.Body
                    noPadding
                    fullHeight
                    noScroll
                >
                    <div className="planning-app__modal FulfilAssignment">
                        <FulfilAssignmentApp newsItem={newsItem} />
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    {!showCancel ? null : (
                        <Button
                            text={gettext('Cancel')}
                            disabled={actionInProgress}
                            onClick={this.handleCancel}
                        />
                    )}
                    {!handleIgnore ? null : (
                        <Button
                            text={ignoreText || gettext('Ignore')}
                            disabled={actionInProgress}
                            onClick={handleIgnore}
                        />
                    )}
                </Modal.Footer>
            </Modal>
        );
    }
}

FulFilAssignmentComponent.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        newsItem: PropTypes.object,
        onCancel: PropTypes.func,
        onIgnore: PropTypes.func,
        showCancel: PropTypes.bool,
        showIgnore: PropTypes.bool,
        ignoreText: PropTypes.string,
        title: PropTypes.string,
    }),
    currentWorkspace: PropTypes.string,
    actionInProgress: PropTypes.bool,
    priorities: PropTypes.array,
    urgencies: PropTypes.array,
    urgencyLabel: PropTypes.string,
};

const mapStateToProps = (state) => ({
    currentWorkspace: selectors.general.currentWorkspace(state),
    actionInProgress: selectors.general.modalActionInProgress(state),
});

export const FulFilAssignmentModal = connect(
    mapStateToProps,
    null
)(FulFilAssignmentComponent);
