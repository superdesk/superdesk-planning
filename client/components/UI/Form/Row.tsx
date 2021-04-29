import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

interface IProps {
    flex?: boolean;
    noPadding?: boolean;
    className?: string | {[key: string]: boolean};
    halfWidth?: boolean;
    enabled?: boolean; // defaults to true
    id?: string;
    testId?: string;
    style?: React.CSSProperties;
    refNode?: React.RefObject<HTMLDivElement>;
}

export class Row extends React.PureComponent<IProps> {
    render() {
        if (!(this.props.enabled ?? true)) {
            return null;
        }

        return (
            <div
                id={this.props.id}
                ref={this.props.refNode}
                data-test-id={this.props.testId}
                style={this.props.style}
                className={classNames(
                    'form__row',
                    {
                        'form__row--flex': this.props.flex,
                        'no-padding': this.props.noPadding,
                        'form__row--half-width': this.props.halfWidth,
                    },
                    this.props.className
                )}
            >
                {this.props.children}
            </div>
        );
    }
}
