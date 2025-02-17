import React from 'react';
import {Spacer, SpacerBlock} from 'superdesk-ui-framework/react';
import {IPropsAuthoringFieldTemplate} from 'superdesk-api';

const requiredIndicator = (
    <span style={{color: 'var(--sd-colour-alert)', fontSize: '1.1rem'}}>*</span>
);

export class FieldTemplate extends React.PureComponent<IPropsAuthoringFieldTemplate> {
    render() {
        const {field, input, validationError, miniToolbar} = this.props;

        const labelJsx = miniToolbar != null
            ? (
                <Spacer h gap="4" justifyContent="space-between" noWrap>
                    <Spacer h gap="4" justifyContent="start" noWrap>
                        <div
                            style={{
                                fontSize: '1.6rem',
                                fontWeight: 'bold',
                                color: 'var(--color-text)',
                            }}
                        >
                            {field.name}
                        </div>
                        {field.fieldConfig.required && requiredIndicator}
                    </Spacer>

                    <div>
                        {miniToolbar}
                    </div>
                </Spacer>
            )
            : (
                <div
                    style={{
                        color: 'var(--color-label-text)',
                        fontSize: '1.1rem',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        letterSpacing: 0.08,
                    }}
                >
                    <Spacer h gap="4" justifyContent="start" noWrap>
                        {field.name}
                        {field.fieldConfig.required && requiredIndicator}
                    </Spacer>
                </div>
            );

        return (
            <div>
                {labelJsx}

                {miniToolbar != null && <SpacerBlock v gap="16" />}

                {input != null && input}

                {validationError != null && (
                    <>
                        <SpacerBlock v gap="4" />

                        <div style={{color: 'var(--sd-colour-alert)'}}>
                            {validationError}
                        </div>
                    </>
                )}
            </div>
        );
    }
}
