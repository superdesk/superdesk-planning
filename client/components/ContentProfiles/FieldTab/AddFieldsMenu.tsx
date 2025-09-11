import React from 'react';
import {IProfileFieldEntry} from 'interfaces';
import {TreeMenu, Button} from 'superdesk-ui-framework/react';
import {getFieldNameTranslated} from '../../../utils/contentProfiles';
import {IVocabulary} from 'superdesk-api';

interface IProps {
    options: Array<{value: IProfileFieldEntry; onSelect: () => void;}>;
    buttonLabel: string;
    vocabularies: Array<IVocabulary>;
    getFieldName: (field: IProfileFieldEntry) => JSX.Element;
}

export default class AddFieldsMenu extends React.PureComponent<IProps, any> {
    render(): React.ReactNode {
        const {options, buttonLabel} = this.props;
        const vocabularyLabels = new Map(this.props.vocabularies.map((x) => [x._id, x.display_name]));

        return (
            <TreeMenu
                key={options.length}
                data-test-id="menu"
                getId={(field) => field.name}
                optionTemplate={(item) => this.props.getFieldName(item)}
                getLabel={(item) => {
                    if (item.schema?.type === 'custom_vocabulary') {
                        return vocabularyLabels.get(item.name);
                    }

                    return getFieldNameTranslated(item.name);
                }}
                getOptions={() => options}
            >
                {(toggle) => (
                    <Button
                        text={buttonLabel}
                        iconOnly={true}
                        icon="plus-large"
                        shape="round"
                        type="primary"
                        onClick={toggle}
                    />
                )}
            </TreeMenu>
        );
    }
}
