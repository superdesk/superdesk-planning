import React from 'react';
import {IProfileFieldEntry} from 'interfaces';
import {TreeMenu, Button} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../../../superdeskApi';
import {getFieldNameTranslated} from '../../../utils/contentProfiles';
import {IVocabulary} from 'superdesk-api';

interface IProps {
    options: Array<{value: IProfileFieldEntry; onSelect: () => void;}>;
    buttonLabel: string;
    allCVs: Immutable.OrderedMap<string, IVocabulary>;
}

export default class AddFieldsMenu extends React.PureComponent<IProps, any> {
    render(): React.ReactNode {
        const {gettext} = superdeskApi.localization;
        const {options, buttonLabel} = this.props;

        return (
            <TreeMenu
                data-test-id="menu"
                getId={(field) => field.name}
                optionTemplate={(item) => item.schema?.type === 'custom_vocabulary' ? (
                    <>
                        {this.props.allCVs.get(item.name).display_name}
                        <span className="sd-text--italic sd-text--light">
                            &nbsp;({gettext('custom vocabulary')})
                        </span>
                    </>
                ) : (
                    <>
                        {getFieldNameTranslated(item.name)}
                    </>
                )}
                getLabel={(item) => {
                    if (item.schema?.type === 'custom_vocabulary') {
                        return this.props.allCVs.get(item.name).display_name;
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
