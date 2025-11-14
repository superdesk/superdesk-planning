import React from 'react';
import PropTypes from 'prop-types';
import {Tooltip} from 'superdesk-ui-framework/react';

import {appConfig} from 'appConfig';

import {gettext, getMapUrl, stringUtils} from '../../utils';

export const Location = ({name, address, multiLine, details}) => {
    if (!name && !address) {
        return null;
    }

    // eslint-disable-next-line react/no-multi-comp
    const renderSingleline = () => (
        <Tooltip
            content={
                <>
                    {name && <div className="sd-line-input__label">{name}</div>}
                    {address && (
                        <div className="sd-line-input__input--address">
                            {address}
                        </div>
                    )}
                </>
            }
        >
            <span className="sd-list-item__location">
                {name || address}
            </span>
        </Tooltip>
    );

    // eslint-disable-next-line react/no-multi-comp
    const renderMultiline = () => (
        <span>
            <i className="icon-map-marker icon--gray" />
            {name}
            {address && (
                <div className="sd-line-input__input--address">
                    {address}
                </div>
            )}
        </span>
    );

    // eslint-disable-next-line react/no-multi-comp
    const renderLocation = () => (multiLine ? renderMultiline() : renderSingleline());

    if (appConfig.street_map_url) {
        return (
            <span className="addgeolookup">
                <a
                    title={gettext('Show on map')}
                    href={getMapUrl(appConfig.street_map_url, name, address)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {renderLocation()}
                </a>
                {details && <div className="sd-padding-t--1"><i className="icon-info-sign icon--blue" /></div>}
                {details && stringUtils.convertNewlineToBreak(details)}
            </span>
        );
    }

    return renderLocation();
};

Location.propTypes = {
    name: PropTypes.string,
    address: PropTypes.string,
    classes: PropTypes.string,
    multiLine: PropTypes.bool,
    details: PropTypes.string,
};

Location.defaultProps = {
    name: '',
    address: '',
    classes: '',
    multiLine: false,
    details: '',
};