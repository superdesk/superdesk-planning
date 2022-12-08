import * as React from 'react';

import {IEditorProfileGroup, ILanguage, IPlanningContentProfile} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {Button, ButtonGroup, Input, Switch, ToggleBox} from 'superdesk-ui-framework/react';
import {IconSelectButton} from '../../UI/IconSelectButton';

interface IProps {
    profile: IPlanningContentProfile;
    group: IEditorProfileGroup;
    isNewGroup: boolean;
    isDirty: boolean;
    languages: Array<ILanguage>;
    errors: {[key: string]: string};
    onCancel(): void;
    saveGroup(): void;
    updateGroupAttribute(field: string, value: string | boolean): void;
    updateGroupTranslation(languageQcode: ILanguage['qcode'], translatedName: string): void;
}

export class GroupEditor extends React.PureComponent<IProps> {
    containerRef: React.RefObject<HTMLDivElement>

    constructor(props) {
        super(props);

        this.containerRef = React.createRef();
        this.renderTranslationInput = this.renderTranslationInput.bind(this);
    }

    componentDidMount() {
        // Place focus on the first `input` element in the form
        this.containerRef.current?.querySelector('input')?.focus();
    }

    renderTranslationInput(language: ILanguage) {
        return (
            <div
                key={language.qcode}
                className="form__group"
            >
                <div className="form__row">
                    <Input
                        label={language.name}
                        type="text"
                        required={true}
                        onChange={this.props.updateGroupTranslation.bind(null, language.qcode)}
                        value={this.props.group.translations.name[language.qcode]}
                        invalid={this.props.errors[`translations.name.${language.qcode}`] != null}
                        error={this.props.errors[`translations.name.${language.qcode}`]}
                    />
                </div>
            </div>
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <div className="side-panel side-panel--right">
                <div className="side-panel__header">
                    <div className="side-panel__heading">
                        {gettext('Details')}
                    </div>
                    <div className="side-panel__sliding-toolbar">
                        <ButtonGroup align="end">
                            <Button
                                text={gettext('Cancel')}
                                onClick={() => this.props.onCancel()}
                            />
                            <Button
                                text={this.props.isNewGroup ?
                                    gettext('Create') :
                                    gettext('Save')
                                }
                                onClick={() => this.props.saveGroup()}
                                type="primary"
                                disabled={!this.props.isDirty}
                            />
                        </ButtonGroup>
                    </div>
                </div>
                <div className="side-panel__content" ref={this.containerRef}>
                    <div className="side-panel__content-block side-panel__content-block--flex">
                        <div className="side-panel__content-block-inner side-panel__content-block-inner--grow">
                            <div className="form__group">
                                <div className="form__item form__item--auto-width">
                                    <IconSelectButton
                                        label={gettext('Icon')}
                                        icon={this.props.group.icon}
                                        onChange={this.props.updateGroupAttribute.bind(null, 'icon')}
                                    />
                                </div>
                                <div className="form__item">
                                    <Input
                                        label={gettext('Name')}
                                        type="text"
                                        required={true}
                                        onChange={this.props.updateGroupAttribute.bind(null, 'name')}
                                        value={this.props.group.name}
                                        invalid={this.props.errors.name != null}
                                        error={this.props.errors.name}
                                    />
                                </div>
                            </div>
                            <div className="form__group">
                                <div className="form__row">
                                    <Switch
                                        label={{text: gettext('Use Togglebox')}}
                                        value={this.props.group.useToggleBox}

                                        onChange={this.props.updateGroupAttribute.bind(null, 'useToggleBox')}
                                    />
                                </div>
                            </div>
                            <div className="form__group">
                                <div className="form__row">
                                    <Switch
                                        label={{text: gettext('Show Bookmark')}}
                                        value={this.props.group.showBookmark}

                                        onChange={this.props.updateGroupAttribute.bind(null, 'showBookmark')}
                                    />
                                </div>
                            </div>
                            {!this.props.languages?.length ? null : (
                                <ToggleBox
                                    title={gettext('Name Translations')}
                                    className="toggle-box--circle"
                                    initiallyOpen={true}
                                >
                                    {this.props.languages.map(this.renderTranslationInput)}
                                </ToggleBox>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
