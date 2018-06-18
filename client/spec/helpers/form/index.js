import {DateTime} from './dateTime';
import {EventSchedule} from './eventSchedule';
import {FileInput} from './fileInput';
import {Input} from './input';
import {LinkInput} from './linkInput';
import {Select} from './select';
import {SelectLocation} from './selectLocation';
import {SelectMetaTerms} from './selectMetaTerms';
import {ToggleInput} from './toggleInput';
import {UrgencyInput} from './urgencyInput';
import {Coverage} from './coverage';
import {CoverageList} from './coverageList';

const fieldToHelper = {
    dates: (form, field) => new EventSchedule(form, field),
    definition_short: (form, field) => new Input(form, field, 'textarea'),
    definition_long: (form, field) => new Input(form, field, 'textarea'),
    internal_note: (form, field, byRow = true) => new Input(form, field, 'textarea', byRow),
    ednote: (form, field, byRow = true) => new Input(form, field, 'textarea', byRow),
    description_text: (form, field) => new Input(form, field, 'textarea'),
    occur_status: (form, field) => new Select(form, field),
    calendars: (form, field) => new SelectMetaTerms(form, field),
    anpa_category: (form, field) => new SelectMetaTerms(form, field),
    subject: (form, field) => new SelectMetaTerms(form, field),
    location: (form, field) => new SelectLocation(form, field),
    files: (form, field) => new FileInput(form, field),
    links: (form, field) => new LinkInput(form, field),
    planning_date: (form, field) => new DateTime(form, field),
    urgency: (form, field) => new UrgencyInput(form, field),
    'flags.marked_for_not_publication': (form, field) => new ToggleInput(form, field),
    coverages: (form, field) => new CoverageList(form, field),
    g2_content_type: (form, field) => new Select(form, field),
    news_coverage_status: (form, field) => new Select(form, field),
    scheduled: (form, field) => new DateTime(form, field),
};

const getInputHelper = (form, field) => {
    if (fieldToHelper[field]) {
        return fieldToHelper[field](form, field, false);
    }

    return new Input(form, field);
};

const getCoverageInputHelper = (form, coverageIndex, field, fieldPrefix = 'planning.') => {
    const coverageField = `coverages[${coverageIndex}].${fieldPrefix}${field}`;

    if (fieldToHelper[field]) {
        return fieldToHelper[field](form, coverageField);
    }

    return new Input(form, coverageField);
};

export {
    DateTime,
    EventSchedule,
    FileInput,
    Input,
    LinkInput,
    Select,
    SelectLocation,
    SelectMetaTerms,
    ToggleInput,
    UrgencyInput,
    getInputHelper,
    getCoverageInputHelper,
    Coverage,
    CoverageList,
};
