import React from 'react';
import PropTypes from 'prop-types';
import {Modal as _Modal} from 'react-bootstrap';
import classNames from 'classnames';

interface IProps {
    children?: any;
    noPadding?: boolean;
    fullHeight?: boolean;
    noScroll?: boolean;
}

export default class Body extends React.Component<IProps> {
    static propTypes: any;

    render() {
        const {children, noPadding, fullHeight, noScroll} = this.props;

        return (
            <_Modal.Body
                className={classNames(
                    'modal__body',
                    {
                        'modal__body--no-padding': noPadding,
                        'modal__body--full-height': fullHeight,
                        'modal__body--no-scroll': noScroll,
                    }
                )}
            >
                {children}
            </_Modal.Body>
        );
    }
}

Body.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.element),
        PropTypes.arrayOf(PropTypes.node),
    ]),
    noPadding: PropTypes.bool,
    noScroll: PropTypes.bool,
    fullHeight: PropTypes.bool,
};
