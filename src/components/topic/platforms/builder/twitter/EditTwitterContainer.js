import PropTypes from 'prop-types';
import React from 'react';
import { Field, reduxForm, formValueSelector } from 'redux-form';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Grid, Row, Col } from 'react-flexbox-grid/lib';
import AppButton from '../../../../common/AppButton';
import withIntlForm from '../../../../common/hocs/IntlForm';
import messages from '../../../../../resources/messages';
import TwitterPreview from './TwitterPreview';
import TwitterCheckboxFieldArray from '../../../../common/TwitterCheckboxFieldArray';
import { notEmptyString } from '../../../../../lib/formValidators';

const formSelector = formValueSelector('platform');

const localMessages = {
  title: { id: 'platform.create.edit.title', defaultMessage: 'Step 1: Configure Your Twitter platform' },
  intro: { id: 'platform.create.edit.intro', defaultMessage: 'Step 1: intro' },
  about: { id: 'platform.create.edit.about',
    defaultMessage: 'This Platform is driven by an open web seed query.  Any stories that match the query you create will be included in the Platform.' },
  errorNoKeywords: { id: 'platform.error', defaultMessage: 'You need to specify a query.' },
  typeCrimson: { id: 'platform.create.edit.crimson', defaultMessage: 'Crimson Hexagon' },
  typeCrimsonId: { id: 'platform.create.edit.crimson.id', defaultMessage: 'Crimson Hexagon ID' },
  typeElite: { id: 'platform.create.edit.elite', defaultMessage: 'Verified Accounts (via Pushshift.io)' },
  typeOther: { id: 'platform.create.edit.other', defaultMessage: 'Other' },
};

class EditTwitterContainer extends React.Component {
  constructor(props) {
    // Track this in local React state because we don't need it anywhere else.
    // We can't read out of the form state becase we need to know when they click "search",
    // but that is updated live as they type.
    super(props);
    this.state = { query: null };
  }

  updateQuery = () => {
    const { change, currentQuery, currentPlatformType } = this.props;
    // TODO: add in twitter sources/feeds
    // change('channel', channel); // redux-form change action
    change('currentPlatformType', currentPlatformType);
    this.setState({ query: currentQuery });
  }

  selectTwitterChannel = (args) => {
    const { channel, handleChannelChange } = this.props;
    // get the values from the channel, store so other components can access it (checkboxes)
    // this is pushed in as previouslySelected into cbx components
    const userSelected = [args];
    const updatedChannel = channel;
    if (updatedChannel) {
      updatedChannel.forEach((p, i) => {
        const toUpdate = userSelected.findIndex(t => t.id === p.id);
        if (toUpdate > -1) {
          updatedChannel[i].selected = userSelected[toUpdate].value;
          updatedChannel[i].value = userSelected[toUpdate].value;
        }
      });
    }
    handleChannelChange(updatedChannel);
  }

  render() {
    const { topicId, initialValues, /* handleMediaChange */ renderTextField, handleSubmit, finishStep, location } = this.props;
    const { formatMessage } = this.props.intl;
    let previewContent = null;
    let nextButtonDisabled = true;
    // TODO, handle multiple twitter choices
    if ((this.state.query !== null) && (this.state.query !== undefined) && (this.state.query.length > 0)) {
      nextButtonDisabled = false;
      previewContent = (
        <div>
          <TwitterPreview topicId={topicId} query={this.state.query} location={location} />
        </div>
      );
    }
    return (
      <Grid>
        <form className="platform-create-edit-keyword" name="platform" onSubmit={handleSubmit(finishStep.bind(this))}>
          <Row>
            <Col lg={10}>
              <h2><FormattedMessage {...localMessages.title} /></h2>
              <p>
                <FormattedMessage {...localMessages.about} />
              </p>
            </Col>
          </Row>
          <Row>
            <Col lg={8} xs={12}>
              <Field
                name="query"
                component={renderTextField}
                placeholder={messages.searchByKeywords}
                fullWidth
                onKeyDown={this.handleKeyDown}
              />
            </Col>
            <Col lg={2} xs={12}>
              <AppButton
                id="open-web-preview-button"
                label={formatMessage(messages.search)}
                style={{ marginTop: 33 }}
                onClick={this.updateQuery}
              />
            </Col>
          </Row>
          <Row>
            <Col lg={8} xs={12}>
              <TwitterCheckboxFieldArray
                name="channel"
                form="platform"
                initVal={initialValues.channel}
                onChange={(args) => this.selectTwitterChannel(args)}
                keepDirtyOnReinitialize
                destroyOnUnmount={false}
              />
            </Col>
          </Row>
          <Row>
            <Col lg={10}>
              <div className="media-field-wrapper">
                {previewContent}
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={8} xs={12}>
              <AppButton disabled={nextButtonDisabled} type="submit" label={formatMessage(messages.next)} primary />
            </Col>
          </Row>
        </form>
      </Grid>
    );
  }
}

EditTwitterContainer.propTypes = {
  // from parent
  topicId: PropTypes.number.isRequired,
  initialValues: PropTypes.object,
  onNextStep: PropTypes.func.isRequired,
  handleChannelChange: PropTypes.func.isRequired,
  // from state
  currentPlatformType: PropTypes.string,
  currentPlatformInfo: PropTypes.object,
  currentQuery: PropTypes.string,
  change: PropTypes.func.isRequired,
  channel: PropTypes.array,
  // from dispatch
  finishStep: PropTypes.func.isRequired,
  // from compositional helper
  location: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  renderTextField: PropTypes.func.isRequired,
  renderCheckbox: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  currentQuery: formSelector(state, 'query'),
  channel: formSelector(state, 'channel'),
  currentPlatformType: state.topics.selected.platforms.selected.platform,
  currentPlatformInfo: state.topics.selected.platforms.selected,
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  handleChannelChange: (updatedChannel) => {
    ownProps.change('channel', updatedChannel);
  },
  handleMediaDelete: () => null, // in create mode we don't need to update the values
  finishStep: (values) => {
    const customProps = {
      query: values.query,
    };
    ownProps.onNextStep(customProps);
  },
});

function validate(values) {
  const errors = {};
  if (!notEmptyString(values.query)) {
    errors.query = true; // localMessages.errorNoKeywords;
  }
  return errors;
}

const reduxFormConfig = {
  form: 'platform', // make sure this matches the sub-components and other wizard steps
  destroyOnUnmount: false, // <------ preserve form data
  forceUnregisterOnUnmount: true, // <------ unregister fields on unmount
  enableReinitialize: true,
  validate,
};

export default
injectIntl(
  withIntlForm(
    reduxForm(reduxFormConfig)(
      connect(mapStateToProps, mapDispatchToProps)(
        EditTwitterContainer
      )
    )
  )
);
