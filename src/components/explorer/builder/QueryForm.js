import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { reduxForm, Field, propTypes, formValueSelector } from 'redux-form';
import { Grid, Row, Col } from 'react-flexbox-grid/lib';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/solr/solr';
import withIntlForm from '../../common/hocs/IntlForm';
import AppButton from '../../common/AppButton';
import withHelp from '../../common/hocs/HelpfulContainer';
import CopyAllComponent from '../../common/CopyAllComponent';
import OpenWebMediaFieldArray from '../../common/form/OpenWebMediaFieldArray';
import MediaPickerDialog from '../../common/mediaPicker/MediaPickerDialog';
import QueryHelpDialog from '../../common/help/QueryHelpDialog';
import MediaHelpDialog from '../../common/help/MediaHelpDialog';
import SavedSearchControls from './SavedSearchControls';
import { emptyString, validDate } from '../../../lib/formValidators';
import { isStartDateAfterEndDate, isValidSolrDate } from '../../../lib/dateUtil';
import { KEYWORD, MEDIA, DATES, getQFromCodeMirror } from '../../../lib/explorerUtil';
import { ALL_MEDIA } from '../../../lib/mediaUtil';
import messages from '../../../resources/messages';
import TrackingEvent, { CLICK_ACTION, EXPLORER_SEARCH_CATEGORY } from '../../../lib/tracking';

const formSelector = formValueSelector('queryForm');

const localMessages = {
  mainTitle: { id: 'explorer.queryBuilder.maintitle', defaultMessage: 'Create Query' },
  addButton: { id: 'explorer.queryBuilder.saveAll', defaultMessage: 'Search' },
  feedback: { id: 'explorer.queryBuilder.feedback', defaultMessage: 'We saved your new source' },
  query: { id: 'explorer.queryBuilder.query', defaultMessage: 'Enter search terms' },
  queryDesc: { id: 'explorer.queryBuilder.query.desc', defaultMessage: 'Media Cloud will return stories that match your search query. We use standard boolean search syntax.' },
  selectSandC: { id: 'explorer.queryBuilder.selectSAndC', defaultMessage: 'Select your media' },
  selectSandCDesc: { id: 'explorer.queryBuilder.selectSAndCDesc', defaultMessage: 'Choose individual sources or collections to be searched. Our system includes collections for a large range of countries, in multiple languages.' },
  selectSandCDescLink: { id: 'explorer.queryBuilder.selectSAndCDescLink', defaultMessage: 'Learn more about choosing media.' },
  SandC: { id: 'explorer.queryBuilder.sAndC', defaultMessage: 'Media' },
  color: { id: 'explorer.queryBuilder.color', defaultMessage: 'Choose a color' },
  dates: { id: 'explorer.queryBuilder.dates', defaultMessage: 'Enter dates' },
  datesDesc: { id: 'explorer.queryBuilder.datesDesc', defaultMessage: 'Enter your inclusive date range. Our database goes back to 2011, however the start date for different sources and collections can vary. Click on a source or collecton to learn more about when we added it.' },
  dateTo: { id: 'explorer.queryBuilder.dateTo', defaultMessage: 'to' },
  queryHelpTitle: { id: 'explorer.queryBuilder.queryHelp.title', defaultMessage: 'Building Query Strings' },
  queryHelpContent: { id: 'explorer.queryBuilder.queryHelp.content', defaultMessage: '<p>You can write boolean queries to search against out database. To search for a single word, just enter that word:</p><code>gender</code><p>You can also use boolean and phrase searches like this:</p><code>"gender equality" OR "gender equity"</code>' },
  saveSearch: { id: 'explorer.queryBuilder.saveQueries', defaultMessage: 'Save Search...' },
  queryStringError: { id: 'explorer.queryBuilder.queryStringError', defaultMessage: 'Using no keywords will match all the stories we have (within the dates and media you pick).' },
  startDateWarning: { id: 'explorer.queryBuilder.warning.startDate', defaultMessage: 'Start Date must be before End Date' },
  invalidDateWarning: { id: 'explorer.queryBuilder.warning.invalidDate', defaultMessage: 'Use the YYYY-MM-DD format' },
  noMediaSpecified: { id: 'explorer.queryBuilder.warning.noMediaSpecified', defaultMessage: 'No media selected' },
  copyQueryKeywordTitle: { id: 'explorer.queryform.copyQueryQ', defaultMessage: 'Copy Query Keywords' },
  copyQueryDatesTitle: { id: 'explorer.queryform.copyQueryDates', defaultMessage: 'Copy Query Dates' },
  copyQueryMediaTitle: { id: 'explorer.queryform.copyQueryMedia', defaultMessage: 'Copy Query Media' },
  copyQueryKeywordMsg: { id: 'explorer.queryform.title.copyQueryQ', defaultMessage: 'Are you sure you want to copy these keywords to all your queries? This will replace the keyword for all your queries.' },
  copyQueryDatesMsg: { id: 'explorer.queryform.title.copyQueryDates', defaultMessage: 'Are you sure you want to copy these dates to all your queries? This will replace the dates for all your queries.' },
  copyQueryMediaMsg: { id: 'explorer.queryform.title.copyQueryMedia', defaultMessage: 'Are you sure you want to copy these media to all your queries? This will replace the media for all your queries.' },
};

class QueryForm extends React.Component {
  constructor(props) {
    super(props);
    this.textInputRef = React.createRef();
  }

  state = { // do not focus on primary textfield if we have a dialog open
    childDialogOpen: false,
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.selected !== this.props.selected) {
      // this.textInputRef.saveRef(); comment out b/c this was only a focus setting anyway (that wasn't working very well)
    }
  }

  getAllActiveQueries = queries => (queries.filter(q => q.deleted !== true));

  setQueryFormChildDialogOpen = () => {
    this.setState(prevState => ({ childDialogOpen: !prevState.childDialogOpen }));
  }

  evalAllQueriesForValidMedia = () => {
    const { queries, mediaUpdates } = this.props;
    const anyQueriesNoMedia = this.getAllActiveQueries(queries).filter(q => (q.uid !== mediaUpdates.uid) && q.media && q.media.length === 0).length; // if any query is missing media
    const thisCurrentQueryFormNoMedia = mediaUpdates && (mediaUpdates.media === undefined || mediaUpdates.media.length === 0) && (mediaUpdates.sources === undefined || mediaUpdates.sources.length === 0) && (mediaUpdates.collections === undefined || mediaUpdates.collections.length === 0) && (mediaUpdates.searches === undefined || mediaUpdates.searches.length === 0);
    return anyQueriesNoMedia || thisCurrentQueryFormNoMedia;
  }

  onSubmitClick = (e) => {
    const { onWillSearch } = this.props;
    if (onWillSearch) {
      onWillSearch(e);
    }
    TrackingEvent(EXPLORER_SEARCH_CATEGORY, CLICK_ACTION);
  }

  render() {
    const { initialValues, selected, buttonLabel, onMediaDelete, onDateChange,
      onDeleteSearch, onLoadSearches, savedSearches, searchNickname, onSaveSearch,
      submitting, handleSubmit, onSave, onMediaChange, renderSolrTextField, renderTextField, /* renderTextFieldWithFocus, */
      onCopyAll } = this.props;
    const { formatMessage } = this.props.intl;
    const cleanedInitialValues = JSON.parse(JSON.stringify({
      ...initialValues,
      q: getQFromCodeMirror(initialValues.q), // handle CodeMirror object or string
    }));
    if (cleanedInitialValues.disabled === undefined) {
      cleanedInitialValues.disabled = false;
    }
    if (initialValues.collections && initialValues.collections.length && initialValues.collections[0].tags_id === ALL_MEDIA) {
      cleanedInitialValues.media = [{ id: ALL_MEDIA, label: formatMessage(messages.allMedia) }];
    } else {
      cleanedInitialValues.media = [];
      if (initialValues.collections && initialValues.collections.length) {
        cleanedInitialValues.media = cleanedInitialValues.media.concat( // merge intial sources and collections into one list for display with `renderFields`
          initialValues.collections,
        );
      }
      if (initialValues.sources && initialValues.sources.length) {
        cleanedInitialValues.media = cleanedInitialValues.media.concat( // merge intial sources and collections into one list for display with `renderFields`
          initialValues.sources,
        );
      }
      // initial values, searches is an object
      if (initialValues.searches && initialValues.searches.tags && Object.keys(initialValues.searches.tags).length > 0) {
        cleanedInitialValues.media = cleanedInitialValues.media.concat(initialValues.searches);
      }
    }
    const selectedCopy = JSON.parse(JSON.stringify({
      ...selected,
      q: getQFromCodeMirror(selected.q), // handle CodeMirror object or string
    }));
    selectedCopy.media = [];
    if (selectedCopy.collections && selectedCopy.collections.length) {
      selectedCopy.media = selectedCopy.media.concat(selectedCopy.collections);
    }
    if (selectedCopy.sources && selectedCopy.sources.length) {
      selectedCopy.media = selectedCopy.media.concat(selectedCopy.sources);
    } // searches is an array

    if (selectedCopy.searches && selectedCopy.searches.tags && Object.keys(selectedCopy.searches.tags).length > 0) {
      selectedCopy.media = selectedCopy.media.concat(selectedCopy.searches);
    } else if (selectedCopy.searches && selectedCopy.searches.length) {
      if (selectedCopy.searches[0].tags && Object.keys(selectedCopy.searches[0].tags).length > 0) {
        selectedCopy.media = selectedCopy.media.concat(selectedCopy.searches);
      }
    }
    const currentQ = selectedCopy.q;
    let mediaLabel = formatMessage(localMessages.SandC);
    mediaLabel = formatMessage(localMessages.selectSandC);
    const queriesMissingMedia = this.evalAllQueriesForValidMedia();
    if (!selectedCopy) { return null; }

    return (
      <form className="app-form query-form" name="queryForm" onSubmit={handleSubmit(onSave)}>
        <div className="query-form-wrapper">
          <Grid>
            <Row>
              <Col lg={4}>
                <div className="q-field-wrapper">
                  <div className="media-field-label query-field-label">
                    <span className="query-field-number">1</span>
                    <CopyAllComponent
                      label={formatMessage(localMessages.query)}
                      title={formatMessage(localMessages.copyQueryKeywordTitle)}
                      msg={formatMessage(localMessages.copyQueryKeywordMsg)}
                      onOk={() => onCopyAll(KEYWORD)}
                    />
                  </div>
                  <Field
                    className="query-field"
                    name="q"
                    type="text"
                    value={currentQ}
                    multiline
                    minRows={3}
                    maxRows={4}
                    fullWidth
                    // onChange={this.focusSelect}
                    // component={renderTextFieldWithFocus}
                    component={renderSolrTextField}
                    ref={(input) => { this.textInputRef = input; }}
                  />
                </div>
                <div className="query-field-desc">
                  <FormattedMessage {...localMessages.queryDesc} />
                  &nbsp;
                  <QueryHelpDialog trigger={formatMessage(messages.queryHelpLink)} />
                </div>
              </Col>
              <Col lg={4}>
                <div className="media-field-wrapper" ref={this.myRef} id="mediaPicker">
                  <div className="media-field-label query-field-label">
                    <span className="query-field-number">2</span>
                    <CopyAllComponent
                      label={mediaLabel}
                      title={formatMessage(localMessages.copyQueryMediaTitle)}
                      msg={formatMessage(localMessages.copyQueryMediaMsg)}
                      onOk={() => onCopyAll(MEDIA)}
                    />
                  </div>
                  <OpenWebMediaFieldArray
                    className="query-field"
                    form="queryForm"
                    fieldName="media"
                    enableReinitialize
                    keepDirtyOnReinitialize
                    destroyOnUnmount={false}
                    onDelete={onMediaDelete}
                    allowRemoval
                    initialValues={selectedCopy || cleanedInitialValues}
                    title="title"
                    intro="intro"
                  />
                  <div>
                    <MediaPickerDialog
                      initMedia={selectedCopy.media ? selectedCopy.media : cleanedInitialValues.media}
                      onConfirmSelection={selections => onMediaChange(selections)}
                      setQueryFormChildDialogOpen={this.setQueryFormChildDialogOpen}
                    />
                  </div>
                  <div className="query-field-desc">
                    <FormattedMessage {...localMessages.selectSandCDesc} />
                    &nbsp;
                    <MediaHelpDialog trigger={formatMessage(localMessages.selectSandCDescLink)} />
                  </div>
                </div>
              </Col>
              <Col lg={4}>
                <div className="dates-field-label query-field-label">
                  <span className="query-field-number">3</span>
                  <CopyAllComponent
                    label={formatMessage(localMessages.dates)}
                    title={formatMessage(localMessages.copyQueryDatesTitle)}
                    msg={formatMessage(localMessages.copyQueryDatesMsg)}
                    onOk={() => onCopyAll(DATES)}
                  />
                </div>
                <div className="dates-field-wrapper">
                  <Field
                    className="query-field start-date-wrapper"
                    maxLength="12"
                    name="startDate"
                    type="inline"
                    component={renderTextField}
                    disableunderline="true"
                    onChange={onDateChange}
                  />
                  <div className="date-for-wrapper"><FormattedMessage {...localMessages.dateTo} /></div>
                  <Field
                    className="query-field end-date-wrapper"
                    maxLength="12"
                    name="endDate"
                    type="inline"
                    component={renderTextField}
                    disableunderline="true"
                    onChange={onDateChange}
                  />
                  <div className="query-field-desc"><FormattedMessage {...localMessages.datesDesc} /></div>
                </div>
              </Col>
            </Row>
          </Grid>
        </div>
        <div className="query-form-actions-wrapper">
          <Grid>
            <Row>
              <Col lg={6} />
              <Col lg={6}>
                <div className="query-form-actions">
                  <SavedSearchControls
                    searchNickname={searchNickname}
                    savedSearches={savedSearches}
                    onLoadSearches={onLoadSearches}
                    onSaveSearch={l => onSaveSearch(l)}
                    onDeleteSearch={onDeleteSearch}
                    submitting={submitting}
                    setQueryFormChildDialogOpen={this.setQueryFormChildDialogOpen}
                  />
                  <AppButton
                    type="submit"
                    label={buttonLabel}
                    disabled={(queriesMissingMedia > 0) || submitting}
                    onClick={(e) => this.onSubmitClick(e)}
                    primary
                  />
                </div>
              </Col>
            </Row>
          </Grid>
        </div>
      </form>
    );
  }
}

QueryForm.propTypes = {
  // from context
  intl: PropTypes.object.isRequired,
  renderTextField: PropTypes.func.isRequired,
  renderSolrTextField: PropTypes.func.isRequired,
  // renderTextFieldWithFocus: PropTypes.func.isRequired,
  renderSelect: PropTypes.func.isRequired,
  searchNickname: PropTypes.string.isRequired,
  savedSearches: PropTypes.array,

  // from parent
  selected: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onColorChange: PropTypes.func,
  onMediaChange: PropTypes.func,
  buttonLabel: PropTypes.string.isRequired,
  initialValues: PropTypes.object,
  onWillSearch: PropTypes.func,
  onLoadSearches: PropTypes.func.isRequired,
  onSaveSearch: PropTypes.func.isRequired,
  onDeleteSearch: PropTypes.func.isRequired,
  onCopyAll: PropTypes.func.isRequired,
  onMediaDelete: PropTypes.func.isRequired,
  onDateChange: PropTypes.func.isRequired,
  // from state
  queries: PropTypes.array,
  // from form helper
  updateQuery: PropTypes.func,
  handleSubmit: PropTypes.func,
  pristine: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
  focusRequested: PropTypes.func,
  mediaUpdates: PropTypes.object,
};


const mapStateToProps = state => ({
  mediaUpdates: formSelector(state, 'uid', 'media', 'sources', 'collections', 'searches'),
  queries: state.explorer.queries.queries ? state.explorer.queries.queries : null,
});

function validate(values, props) {
  const { formatMessage } = props.intl;
  const errors = {};
  if (!validDate(values.startDate) || !isValidSolrDate(values.startDate)) {
    errors.startDate = { _error: formatMessage(localMessages.invalidDateWarning) };
  }
  if (!validDate(values.endDate) || !isValidSolrDate(values.endDate)) {
    errors.endDate = { _error: formatMessage(localMessages.invalidDateWarning) };
  }
  if (validDate(values.startDate) && validDate(values.endDate) && isStartDateAfterEndDate(values.startDate, values.endDate)) {
    errors.startDate = { _error: formatMessage(localMessages.startDateWarning) };
  }
  if ((!values.collections || !values.collections.length)
    && (!values.sources || !values.sources.length)
    && (!values.media || !values.media.length)) {
    errors.media = { _error: formatMessage(localMessages.noMediaSpecified) };
  }
  return errors;
}

function warn(values, props) {
  const { formatMessage } = props.intl;
  const warnings = {};
  if ((!values.collections || !values.collections.length)
    && (!values.sources || !values.sources.length)
    && (!values.media || !values.media.length)) {
    warnings.media = { _warning: formatMessage(localMessages.noMediaSpecified) };
  }
  // first time through text is a form field, then a codemirror object
  if (values.q) {
    const queryText = (typeof values.q === 'string') ? values.q : getQFromCodeMirror(values.q);
    if (emptyString(queryText)) {
      const errString = formatMessage(localMessages.queryStringError, { name: values.label });
      warnings.q = { _warning: errString };
    }
  }
  return warnings;
}

export default
withIntlForm(
  withHelp(localMessages.queryHelpTitle, localMessages.queryHelpContent)(
    reduxForm({ propTypes, validate, warn })(
      connect(mapStateToProps, null)(
        QueryForm
      ),
    ),
  ),
);
