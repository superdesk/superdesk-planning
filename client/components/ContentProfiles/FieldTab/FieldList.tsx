import * as React from 'react';

import {IEditorProfile, IEditorProfileGroup, IProfileFieldEntry} from '../../../interfaces';

import {getProfileGroupNameTranslated} from '../../../utils/contentProfiles';
import {superdeskApi} from '../../../superdeskApi';

import {ToggleBox} from 'superdesk-ui-framework/react';
import {arrayMove, WithSortable} from '@sourcefabric/common';
import AddFieldsMenu from './AddFieldsMenu';
import * as List from '../../UI/List';
import ProfileFieldTemplate from './ListElementTemplate';
import {IVocabulary} from 'superdesk-api';

interface IProps {
    profile: IEditorProfile;
    group?: IEditorProfileGroup;
    fields: Array<IProfileFieldEntry>;
    unusedFields: Array<IProfileFieldEntry>;
    systemRequiredFields?: Array<string>;
    selectedField?: string;

    onSortChange(fields: Array<IProfileFieldEntry>): void;
    onClick(item: IProfileFieldEntry): void;
    insertField(item: IProfileFieldEntry, groupId: IEditorProfileGroup['_id'], index: number): void;
    removeField(item: IProfileFieldEntry): void;
    customVocabularies: Array<IVocabulary>;
    getFieldName(fieldEntry: IProfileFieldEntry): JSX.Element;
}

export class FieldList extends React.PureComponent<IProps> {
    renderList() {
        const {gettext} = superdeskApi.localization;

        return (this.props.fields ?? []).length < 1 ? (
            <div className="planning-profile__empty-list">
                <AddFieldsMenu
                    vocabularies={this.props.customVocabularies}
                    options={this.props.unusedFields.map((item) => ({
                        value: item,
                        onSelect: () => this.props.insertField(item, this.props.group?._id, 0),
                    }))}
                    buttonLabel={gettext('Add first field')}
                    getFieldName={this.props.getFieldName}
                />
            </div>
        ) : (
            <List.Group spaceBetween>
                <WithSortable
                    items={this.props.fields}
                    getId={(item) => item.name}
                    itemTemplate={(item) => (
                        <ProfileFieldTemplate
                            vocabularies={this.props.customVocabularies}
                            group={this.props.group}
                            selectedField={this.props.selectedField}
                            systemRequiredFields={this.props.systemRequiredFields}
                            fieldEntry={item.item}
                            fields={this.props.fields}
                            insertField={this.props.insertField}
                            onClick={this.props.onClick}
                            removeField={this.props.removeField}
                            unusedFields={this.props.unusedFields}
                            getFieldName={this.props.getFieldName}
                        />
                    )}
                    options={{
                        distance: 10,
                        onSortEnd: ({
                            oldIndex,
                            newIndex
                        }) => {
                            const itemsSorted = arrayMove(this.props.fields, oldIndex, newIndex);

                            this.props.onSortChange(itemsSorted);
                        }
                    }}
                />
            </List.Group>
        );
    }

    render() {
        return this.props.group?._id == null ? (
            this.renderList()
        ) : (
            <ToggleBox
                variant="simple"
                key={this.props.group._id}
                title={getProfileGroupNameTranslated(this.props.group)}
                className="toggle-box--circle toggle-box--no-line"
                initiallyOpen={true}
            >
                {this.renderList()}
            </ToggleBox>
        );
    }
}
