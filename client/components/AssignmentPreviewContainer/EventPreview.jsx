import React from 'react';
import PropTypes from 'prop-types';
import TextareaAutosize from 'react-textarea-autosize';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {get} from 'lodash';
import {Datetime} from '../../components';
import {Location} from '../Location';
import {gettext} from '../../utils';


// eslint-disable-next-line complexity
export const EventPreviewComponent = ({item, formProfile, createLink, streetMapUrl}) => {
    if (!item) {
        return null;
    }

    let location = get(item, 'location', {});
    let locationName = get(location, 'name');
    let formattedAddress = get(location, 'formatted_address', '');

    return (
        <div>
            {get(formProfile, 'editor.name.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        {gettext('Name')}
                    </label>
                    <p>
                        {item.name || '-'}
                    </p>
                </div>
            }

            {get(formProfile, 'editor.definition_short.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        {gettext('Description')}
                    </label>
                    <p>
                        {item.definition_short || '-'}
                    </p>
                </div>
            }

            <div className="form__row form__row--flex EventDates">
                <div className="form__row-item">
                    <label className="form-label form-label--light">
                        {gettext('From')}
                    </label>
                    <p><Datetime date={get(item, 'dates.start')}/></p>
                </div>
                <div className="form__row-item">
                    <label className="form-label form-label--light">
                        {gettext('To')}
                    </label>
                    <p><Datetime date={get(item, 'dates.end')}/></p>
                </div>
            </div>

            <div className="form__row">
                <label className="form-label form-label--light">
                    {gettext('Location')}
                </label>
                {(locationName || formattedAddress) &&
                    <span className="addgeolookup__input-wrapper">
                        <Location
                            name={locationName}
                            address={formattedAddress}
                            mapUrl={streetMapUrl}
                            multiLine={true}
                        />
                    </span>
                    ||
                    <p>-</p>
                }
            </div>


            {get(formProfile, 'editor.definition_long.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        {gettext('Long Description')}
                    </label>
                    <TextareaAutosize
                        value={item.definition_long || '-'}
                        disabled={true}
                    />
                </div>
            }

            {get(formProfile, 'editor.ednote.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        {gettext('Ed Note')}
                    </label>
                    <TextareaAutosize
                        value={item.ednote || '-'}
                        disabled={true}
                    />
                </div>
            }


            <div className="form__row">
                <label className="form-label form-label--light">
                    {gettext('Occurrence status')}
                </label>
                <p>
                    {get(item.occur_status, 'label') ||
                    get(item.occur_status, 'name') || '-'}
                </p>
            </div>


            {get(formProfile, 'editor.links.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        {gettext('Links')}
                    </label>

                    {get(item, 'links.length', 0) &&
                        get(item, 'links').map((link, index) => {
                            const href = link.toLowerCase().startsWith('http://') ||
                                link.toLowerCase().startsWith('https://') ? link :
                                `http://${link}`;

                            return <div key={index}>
                                <a target="_blank" href={href}>
                                    {link}
                                </a>
                            </div>;
                        }
                        )
                    ||
                        <p>-</p>
                    }
                </div>
            }

            {get(formProfile, 'editor.files.enabled') &&
                <div className="form__row">
                    <label className="form-label form-label--light">
                        {gettext('Attachments')}
                    </label>

                    {get(item, 'files.length', 0) &&
                        get(item, 'files').map((file, index) =>
                            <div key={index}>
                                <a href={createLink(file)} target="_blank">
                                    {file.media.name}&nbsp;
                                    ({Math.round(file.media.length / 1024)}kB)
                                </a>
                            </div>
                        )
                    ||
                        <p>-</p>
                    }
                </div>
            }
        </div>
    );
};

EventPreviewComponent.propTypes = {
    item: PropTypes.object,
    formProfile: PropTypes.object,
    createLink: PropTypes.func,
    streetMapUrl: PropTypes.string
};

const mapStateToProps = (state) => ({
    createLink: (f) => (selectors.getServerUrl(state) + '/upload/' + f.filemeta.media_id + '/raw'),
    streetMapUrl: selectors.config.getStreetMapUrl(state)
});


export const EventPreview = connect(mapStateToProps)(EventPreviewComponent);