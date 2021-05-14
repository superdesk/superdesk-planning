import {IEditorProfile, ISearchProfile} from '../interfaces';

export function filterProfileForEnabledFields(profile: IEditorProfile, fields: Array<string>): Array<string> {
    return fields.filter(
        (field) => profile.editor[field]?.enabled ?? true
    );
}

export function profileConfigToFormProfile(
    config: IEditorProfile,
    fields: Array<Array<string>>,
    props: {[key: string]: any}
): {
    profile: ISearchProfile,
    fieldProps: {[key: string]: any},
} {
    const profile: ISearchProfile = {};
    const fieldProps = {};
    let index: number = 0;

    fields.forEach((field) => {
        const renderField = field[0];
        const profileField = field[1] ?? field[0];

        if (config.editor[profileField]?.enabled ?? true) {
            // Add this field to the render profile
            profile[renderField] = {
                enabled: true,
                index: index,
            };
            index++;

            // Add this field to the render props
            fieldProps[renderField] = props[renderField] ?? {};
            fieldProps[renderField].required = config.schema[profileField]?.required ?? false;
        }
    });

    return {
        profile,
        fieldProps,
    };
}
