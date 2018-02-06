import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {gettext} from '../../../../utils';

import {Popup, Header, Content, Label} from '../../Popup';

import './style.scss';

export const ColouredValuePopup = ({
    target,
    onCancel,
    title,
    clearable,
    onChange,
    getClassNamesForOption,
    options,
    labelKey,
    valueKey,
    popupContainer,
}) => (
    <Popup
        target={target}
        close={onCancel}
        className="select-coloured-value__popup"
        popupContainer={popupContainer}
    >
        {title && (
            <Header noPadding={true}>
                <Label text={title} centerText={true} />
            </Header>
        )}

        <Content noPadding={true}>
            <ul>
                {clearable && (
                    <li>
                        <button type="button"
                            onClick={onChange.bind(null, {
                                [labelKey]: 'None',
                                [valueKey]: null,
                            })} >
                            <span>{gettext('None')}</span>
                        </button>
                    </li>
                )}

                {options.map((opt, index) => (
                    <li key={index}>
                        <button type="button" onClick={onChange.bind(null, opt)} >
                            <span className={getClassNamesForOption(opt)}>{get(opt, valueKey, '')}</span>
                            &nbsp;&nbsp;{get(opt, labelKey, '')}
                        </button>
                    </li>
                ))}
            </ul>
        </Content>
    </Popup>
);

ColouredValuePopup.propTypes = {
    onChange: PropTypes.func,
    onCancel: PropTypes.func,
    title: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.object,
    })).isRequired,
    getClassNamesForOption: PropTypes.func,
    clearable: PropTypes.bool,
    target: PropTypes.string.isRequired,

    labelKey: PropTypes.string,
    valueKey: PropTypes.string,
    popupContainer: PropTypes.func,
};

ColouredValuePopup.defaultProps = {
    labelKey: 'name',
    valueKey: 'qcode',
};
