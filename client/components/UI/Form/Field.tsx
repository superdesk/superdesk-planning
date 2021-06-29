import React from 'react';
import {get} from 'lodash';

import {Row} from './Row';

interface IProps {
    component: any;
    field: string;
    profileName: string;
    label: string;
    item: any;
    diff: any;
    onChange(field: string | {[key: string]: any}, value: any): void;
    defaultValue: any;
    formProfile: any;
    errors?: {[key: string]: any};
    error?: string;
    row?: boolean; // defaults to true
    enabled?: boolean; // defaults to true
    showErrors?: boolean;
    value: any;
    onFocus?(): void;
    scheme?: string;
    testId?: string;
}

interface IState {
    dirty: boolean;
}

/**
 * @ngdoc react
 * @name Field
 * @description Component to encapsulate an input component in a form as a Field
 */
export class Field extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {dirty: false};
    }

    componentWillReceiveProps(nextProps) {
        const {field, formProfile} = this.props;

        // If this field is disabled, then no need to perform checks
        if (!(nextProps.enabled ?? true) || !get(formProfile, `editor.${field}.enabled`, true)) {
            return;
        }

        // If the initial value changes, then we assume the form input object has changed too
        // i.e. changed to a different Event instance
        // In that case, set the dirty flag back to false
        if (get(nextProps.item, field) && nextProps.item[field] !== get(this.props.item, field)) {
            this.setState({dirty: false});
        } else if (
            get(nextProps.diff, field) !== get(this.props.diff, field) ||
            get(nextProps, 'value') !== get(this.props, 'value')
        ) {
            this.setState({dirty: true});
        }
    }

    render() {
        const {
            component,
            field,
            profileName,
            diff,
            onChange,
            defaultValue,
            formProfile,
            errors,
            error,
            row = true,
            enabled = true,
            showErrors,
            value,
            onFocus,
            testId,
            ...props
        } = this.props;

        const profileField = profileName || field;

        if (!enabled || !get(formProfile, `editor["${profileField}"].enabled`, true)) {
            return null;
        }

        const schema = get(formProfile, `schema["${profileField}"]`) || {};
        let currentError = (this.state.dirty || showErrors) ? (error || get(errors, field)) : null;
        const currentValue = value || get(diff, field);

        const Component = component;
        const child = (
            <Component
                field={field}
                profileField={profileField}
                value={currentValue || defaultValue}
                diff={diff}
                onChange={onChange}
                maxLength={schema.validate_on_post ? 0 : schema.maxlength}
                required={schema.validate_on_post ? false : schema.required}
                message={currentError}
                invalid={!!currentError}
                errors={errors}
                showErrors={showErrors}
                dirty={this.state.dirty}
                formProfile={formProfile}
                row={row}
                onFocus={onFocus}
                {...props}
            />
        );

        return !row ? child : (
            <Row
                id={`form-row-${field}`}
                data-test-id={testId}
            >{child}</Row>
        );
    }
}
