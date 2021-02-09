import * as React from 'react';

interface IProps {
    label: string;
    value: string;
    light?: boolean;
    style?: 'normal' | 'strong' | 'light' | 'italic' | 'serif'; // defaults to normal
}

export class FormPreviewItem extends React.PureComponent<IProps> {
    render() {
        const labelClass = !this.props.light ?
            'form-label' :
            'form-label form-label--light';
        const textClass = `sd-text__${this.props.style ?? 'normal'}}`;

        return (
            <div className="form__row">
                <label className={labelClass}>
                    {this.props.label}
                </label>
                <p className={textClass}>
                    {this.props.value}
                </p>
            </div>
        );
    }
}
