import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from '../';
import {Button} from '../UI';
import {get} from 'lodash';
import {KEYCODES} from '../../constants';
import {gettext} from '../../utils';

export class SelectDeskTemplate extends React.Component {
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
        const {handleHide,
            modalProps} = this.props;

        const handleSelect = (value) => {
            handleHide();
            modalProps.onSelect(value);
        };

        // eslint-disable-next-line react/no-multi-comp
        const templateItem = (template) => (
            <button
                className="btn btn--text-only"
                onClick={() => handleSelect(template)}
            >
                <span className="pull-left">
                    {template.template_name}
                </span>
            </button>
        );

        return (
            <Modal show={true} onHide={handleHide}>
                <Modal.Header>
                    <h3 className="modal__heading">{gettext('Select template')}</h3>
                    <a className="icn-btn" aria-label={gettext('Close')} onClick={this.handleCancel}>
                        <i className="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <fieldset>
                            {!!modalProps.defaultTemplate && (
                                <div className="field">
                                    <label>{gettext('Default Template')}</label>
                                    {templateItem(modalProps.defaultTemplate)}
                                </div>
                            )}

                            {get(modalProps, 'publicTemplates.length', 0) > 0 && (
                                <div className="field">
                                    <label>{gettext('Desk Templates')}</label>
                                    <ul>
                                        {modalProps.publicTemplates.map((template, index) => (
                                            <li key={index}>
                                                {templateItem(template)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {get(modalProps, 'privateTemplates.length', 0) > 0 && (
                                <div className="field">
                                    <label>{gettext('My Templates')}</label>
                                    <ul>
                                        {modalProps.privateTemplates.map((template, index) => (
                                            <li key={index}>
                                                {templateItem(template)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </fieldset>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleCancel}>{gettext('Cancel')}</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

SelectDeskTemplate.propTypes = {
    handleHide: PropTypes.func.isRequired,
    modalProps: PropTypes.shape({
        onSelect: PropTypes.func.isRequired,
        onCancel: PropTypes.func,
        defaultTemplate: PropTypes.object,
        publicTemplates: PropTypes.array,
        privateTemplates: PropTypes.array,
    }),
};
