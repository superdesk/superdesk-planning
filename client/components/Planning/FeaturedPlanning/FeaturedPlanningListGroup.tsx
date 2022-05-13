import React from 'react';
import classNames from 'classnames';

interface IProps {
    leftBorder?: boolean;
}

export class FeaturedPlanningListGroup extends React.PureComponent<IProps> {
    render() {
        return (
            <div
                className={classNames(
                    'sd-page-content__content-block',
                    'grid__item',
                    'grid__item--col-6',
                    'sd-column-box__main-column',
                    'sd-column-box__main-column__listpanel',
                    'FeatureListGroup',
                    {'FeatureListGroup--left-border': this.props.leftBorder}
                )}
            >
                <div>
                    <div
                        className={classNames(
                            'sd-column-box__main-column__items',
                            'sd-column-box__main-column__items--featured'
                        )}
                    >
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}
