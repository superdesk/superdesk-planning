import React from 'react'
import classNames from 'classnames'
import { pickBy } from 'lodash'

export default function ModalDialog({ dialogClassName, children, style, className, ...props }) {
    const modalStyle = {
        display: 'block',
        ...style,
    }
    const bsClasses = [
        'bsClass',
        'bsSize',
        'bsStyle',
        'bsRole',
    ]
    const elementProps = pickBy(props, (value, key) => (bsClasses.indexOf(key) === -1))
    return (
        <div
            {...elementProps}
            tabIndex="-1"
            role="dialog"
            style={modalStyle}
            className={className}>
            <div className={classNames(dialogClassName, 'modal__dialog')}>
                <div className="modal__content" role="document">
                    {children}
                </div>
            </div>
        </div>
    )
}

ModalDialog.propTypes = {
    children: React.PropTypes.oneOfType([
        React.PropTypes.element,
        React.PropTypes.arrayOf(React.PropTypes.element),
    ]),
    style: React.PropTypes.object,
    className: React.PropTypes.string,
    dialogClassName: React.PropTypes.string,
}
