import React from 'react';
import PropTypes from 'prop-types';
import {Modal} from '../';
import {Button} from '../UI';
import {get} from 'lodash';

export const SelectDeskTemplate = ({handleHide, modalProps}) => {
    const handleCancel = () => {
        handleHide();
        if (modalProps.onCancel) {
            modalProps.onCancel();
        }
    };

    const handleSelect = (value) => {
        handleHide();
        modalProps.onSelect(value);
    };

    // eslint-disable-next-line react/no-multi-comp
    const templateItem = (template) => (
        <button className="btn btn--text-only"
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
                <a className="close" onClick={handleCancel}>
                    <i className="icon-close-small" />
                </a>
                <h3>{gettext('Select template')}</h3>
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
                <Button onClick={handleCancel}>{gettext('Cancel')}</Button>
            </Modal.Footer>
        </Modal>
    );
};

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
