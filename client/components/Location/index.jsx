import React from 'react';
import PropTypes from 'prop-types';
import {gettext, getMapUrl} from '../../utils';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

export const Location = ({name, address, mapUrl, multiLine}) => {
    if (!name && !address) {
        return null;
    }

    // eslint-disable-next-line react/no-multi-comp
    const renderSingleline = () => (
        <OverlayTrigger
            overlay={<Tooltip id="location_tooltip" className="tooltip--text-left">
                {name && <div className="sd-line-input__label">{name}</div>}
                {address && <div className="sd-line-input__input--address">
                    {address}
                </div>}
            </Tooltip>}
        >
            <span className="sd-list-item__location">
                {name || address}
            </span>
        </OverlayTrigger>
    );

    // eslint-disable-next-line react/no-multi-comp
    const renderMultiline = () => (
        <span>
            <i className="icon-map-marker icon--gray"/>
            {name}
            {address && <div className="sd-line-input__input--address">
                {address}
            </div>}
        </span>
    );

    // eslint-disable-next-line react/no-multi-comp
    const renderLocation = () => (multiLine ? renderMultiline() : renderSingleline());

    if (mapUrl) {
        return (
            <a
                title={gettext('Show on map')}
                href={getMapUrl(mapUrl, name, address)}
                target="_blank"
                rel="noopener noreferrer"
                className="addgeolookup"
            >
                {renderLocation()}
            </a>
        );
    }

    return renderLocation();
};

Location.propTypes = {
    name: PropTypes.string,
    address: PropTypes.string,
    mapUrl: PropTypes.string,
    classes: PropTypes.string,
    multiLine: PropTypes.bool,
};

Location.defaultProps = {
    name: '',
    address: '',
    mapUrl: '',
    classes: '',
    multiLine: false,
};