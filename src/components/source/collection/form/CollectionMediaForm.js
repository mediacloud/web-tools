import PropTypes from 'prop-types';
import React from 'react';
import Link from 'react-router/lib/Link';
import { FieldArray, Field, reduxForm, formValueSelector } from 'redux-form';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Row, Col } from 'react-flexbox-grid/lib';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { updateFeedback } from '../../../../actions/appActions';
import withIntlForm from '../../../common/hocs/IntlForm';
import SourceSearchContainer from '../../controlbar/SourceSearchContainer';
import CollectionUploadSourceContainer from '../CollectionUploadSourceContainer';
import { googleFavIconUrl } from '../../../../lib/urlUtil';
import { RemoveButton } from '../../../common/IconButton';
import AppButton from '../../../common/AppButton';
import messages from '../../../../resources/messages';
import CollectionCopyConfirmer from './CollectionCopyConfirmer';
// import AppButton from '../../../common/AppButton';
import AddByUrlConfirmer from './AddByUrlConfirmer';

// show an extra submit button if source list is longer than this many entries
const EXTRA_BUTTON_LIST_LENGTH = 7;

const formSelector = formValueSelector('collectionForm');

const localMessages = {
  title: { id: 'collection.media.title', defaultMessage: 'Add Media Sources' },
  sourcesToInclude: { id: 'collection.media.sources', defaultMessage: 'Sources To Include' },
  tabSource: { id: 'collection.media.addSource', defaultMessage: 'Add Existing Source' },
  tabSourceIntro: { id: 'collection.media.addSource.intro', defaultMessage: 'You can add individual sources to this collection by searching for their name or url:' },
  tabCollection: { id: 'collection.media.addCollection', defaultMessage: 'Import From Collection' },
  tabCollectionIntro: { id: 'collection.media.addCollection.intro', defaultMessage: 'You can import all the sources from another collection into this one.  This is useful for "merging" collections.  Just search for the collection to import sources from:' },
  tabUpload: { id: 'collection.media.addSpreadsheet', defaultMessage: 'Upload a Spreadsheet' },
  tabUrls: { id: 'collection.media.addURLs', defaultMessage: 'Add URLs Manually' },
  tabUrlsIntro: { id: 'collection.media.addURLs.intro', defaultMessage: 'You can type in up to 100 urls to add directly' },
  sourceUrlHint: { id: 'collection.media.addURLs.hint', defaultMessage: 'Type in the URLs of each media source, one per line.' },
  addSourcesByUrl: { id: 'collection.media.addURLs.button', defaultMessage: 'Add These URLs' },
  sourcesAddedFeedback: { id: 'collection.media.sources.addedFeedback',
    defaultMessage: 'Added {sourceCount, plural,\n =0 {nothing}\n =1 {one source}\n other {# sources}}',
  },
  verify: { id: 'collection.media.verify', defaultMessage: 'Verify' },
};

function TabContainer(props) {
  return (
    <div>
      <h3><FormattedMessage {...props.text} /></h3>
      <p><FormattedMessage {...props.intro} /></p>
      {props.children}
    </div>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
  text: PropTypes.object.isRequired,
  intro: PropTypes.object.isRequired,
};

class SourceSelectionRendererRaw extends React.Component {
  state = {
    value: 0,
    collectionId: null, // the id of a collection to copy
    sourceUrls: null, // an array of source urls to add by hand
  };

  handleChange = (event, value) => {
    this.setState({ value });
  };

  resetCollectionId = () => this.setState({ collectionId: null });

  resetSourceUrls = () => this.setState({ sourceUrls: null });

  pickCollectionToCopy = (collectionId) => {
    this.setState({ collectionId });
  }

  copyCollection = (collection) => {
    this.addSources(collection.sources);
    this.setState({ collectionId: null });
  }

  // make sure we don't add sources that are already on the list
  addSources = (sources) => {
    const { fields, currentSources, onSourcesAdded } = this.props;
    const existingSourceIds = currentSources ? currentSources.map(source => source.media_id) : [];
    let countAdded = 0;
    sources.forEach((m) => {
      if (!existingSourceIds.includes(m.media_id)) {
        fields.unshift(m);
        countAdded += 1;
      }
    });
    onSourcesAdded(countAdded);
  }

  showConfirmer = () => {
    this.setState({ sourceUrls: true });
  }

  processSourcesByUrl = () => {
    const { sourceUrlsToAdd } = this.props;
    const urls = sourceUrlsToAdd.split('\n').filter(s => s !== '' && s !== undefined); // in case of empty lines
    this.setState({ sourceUrls: urls });
  }

  mergeSourcesFromCollectionsOrSearch = (searchResults) => {
    if (searchResults) {
      this.addSources(searchResults);
    }
  }

  render() {
    const { sourceUrlsToAdd, submitButton, fields, meta: { error }, currentSources, editCollectionId, renderTextField } = this.props;
    const { formatMessage } = this.props.intl;
    let copyConfirmation = null;
    if (this.state.collectionId) {
      copyConfirmation = (
        <CollectionCopyConfirmer
          collectionId={this.state.collectionId}
          onConfirm={this.copyCollection}
          onCancel={this.resetCollectionId}
        />
      );
    }
    let addByUrlConfirmer = null;
    if (this.state.sourceUrls) {
      addByUrlConfirmer = (
        <AddByUrlConfirmer
          urls={this.state.sourceUrls} // split out from /n
          onConfirm={this.addSources} // go try to create these sources - then received by formSelector into fieldarray
          onCancel={this.resetSourceUrls}
        />
      );
    }
    let verifyBtn = null;
    if (sourceUrlsToAdd) {
      verifyBtn = <AppButton onClick={this.processSourcesByUrl} label={formatMessage(localMessages.verify)} />;
    }
    const firstTab = (
      <TabContainer text={localMessages.tabSource} intro={localMessages.tabSourceIntro}>
        <Row>
          <Col lg={6}>
            <SourceSearchContainer
              searchCollections={false}
              onMediaSourceSelected={item => this.addSources([item])}
              maxSources={30}
            />
          </Col>
        </Row>
      </TabContainer>
    );
    const secondTab = (
      <TabContainer text={localMessages.tabCollection} intro={localMessages.tabCollectionIntro}>
        <Row>
          <Col lg={6}>
            <SourceSearchContainer
              searchSources={false}
              onCollectionSelected={c => this.pickCollectionToCopy(c.tags_id)}
              maxSources={30}
            />
            {copyConfirmation}
          </Col>
        </Row>
      </TabContainer>
    );
    const thirdTab = (
      <TabContainer text={localMessages.tabCollection} intro={localMessages.tabUrlsIntro}>
        <Field
          name="sourceUrls"
          component={renderTextField}
          fullWidth
          multiline
          minRows={4}
          label={formatMessage(localMessages.sourceUrlHint)}
        />
        {verifyBtn}
        {addByUrlConfirmer}
      </TabContainer>
    );
    const fourthTab = (
      <TabContainer text={localMessages.tabCollection} intro={localMessages.tabCollectionIntro}>
        <CollectionUploadSourceContainer
          onConfirm={item => this.addSources(item)}
          mysources={currentSources}
          myCollectionId={editCollectionId}
        />
      </TabContainer>
    );
    // show a extra submit button for convenience at top of long list
    const topButtonContent = (fields.length > EXTRA_BUTTON_LIST_LENGTH) ? submitButton : null;
    return (
      <div className="collection-media-form">

        <div className="form-section collection-media-form-inputs">
          <Row>
            <Col lg={12}>
              <h2><FormattedMessage {...localMessages.title} /></h2>
            </Col>
          </Row>
          <Row>
            <Col lg={10}>
              <Tabs value={this.state.value} onChange={this.handleChange}>
                <Tab
                  label={formatMessage(localMessages.tabSource)}
                  textColor="primary"
                />
                <Tab
                  label={formatMessage(localMessages.tabCollection)}
                  textColor="primary"
                />
                <Tab
                  label={formatMessage(localMessages.tabUrls)}
                />
                <Tab
                  label={formatMessage(localMessages.tabUpload)}
                />
              </Tabs>
              {this.state.value === 0 && firstTab}
              {this.state.value === 1 && secondTab}
              {this.state.value === 2 && thirdTab}
              {this.state.value === 3 && fourthTab}
            </Col>
          </Row>
        </div>

        <div className="form-section collection-media-form-list">
          <Row>
            <Col lg={10}>
              {topButtonContent}
              <h2><FormattedMessage {...localMessages.sourcesToInclude} /></h2>
            </Col>
          </Row>
          <Row>
            <Col lg={10}>
              <table width="100%">
                <tbody>
                  <tr>
                    <th />
                    <th><FormattedMessage {...messages.sourceNameProp} /></th>
                    <th><FormattedMessage {...messages.sourceUrlProp} /></th>
                    <th />
                  </tr>
                  {fields.map((source, idx) => (
                    <Field
                      key={idx}
                      name={source}
                      component={info => (
                        <tr key={info.input.value.media_id ? info.input.value.media_id : info.input.value.id} className={(idx % 2 === 0) ? 'even' : 'odd'}>
                          <td>
                            <img className="google-icon" src={googleFavIconUrl(info.input.value.url)} alt={info.input.value.name} />
                          </td>
                          <td>
                            <Link to={`/sources/${info.input.value.media_id ? info.input.value.media_id : info.input.value.id}`}>{info.input.value.name}</Link>
                          </td>
                          <td>
                            <a href={`${info.input.value.url}`} target="_new">{info.input.value.url}</a>
                          </td>
                          <td>
                            <RemoveButton color="red" onClick={() => fields.remove(idx)} />
                          </td>
                        </tr>
                      )}
                    />
                  ))}
                </tbody>
              </table>
            </Col>
          </Row>
          <Row>
            <Col lg={10}>
              {error && <div className="error">{error}</div>}
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

SourceSelectionRendererRaw.propTypes = {
  // from form heper
  fields: PropTypes.object,
  meta: PropTypes.object,
  initialValues: PropTypes.object,
  renderTextField: PropTypes.func.isRequired,
  // from parent
  submitButton: PropTypes.node,
  currentSources: PropTypes.array,
  sourceUrlsToAdd: PropTypes.string,
  editCollectionId: PropTypes.string,
  onSourcesAdded: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
};

const SourceSelectionRenderer = withIntlForm(SourceSelectionRendererRaw);

const CollectionMediaForm = props => (
  <div>
    <FieldArray
      name="sources"
      component={SourceSelectionRenderer}
      currentSources={props.currentSources}
      sourceUrlsToAdd={props.sourceUrlsToAdd} // from form - one long string, not an array
      editCollectionId={props.initialValues.id}
      onSourcesAdded={props.handleSourceAdded}
      submitButton={props.submitButton}
      intl={props.intl}
    />
  </div>
);


CollectionMediaForm.propTypes = {
  // from compositional chain
  intl: PropTypes.object.isRequired,
  renderTextField: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  // from form helper
  // from parent
  submitButton: PropTypes.node,
  // from state
  currentSources: PropTypes.array,
  sourceUrlsToAdd: PropTypes.string,
  // from dispatch
  handleSourceAdded: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  currentSources: formSelector(state, 'sources'),
  sourceUrlsToAdd: formSelector(state, 'sourceUrls'),
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  handleSourceAdded: (sourceCount) => {
    const message = ownProps.intl.formatMessage(localMessages.sourcesAddedFeedback, { sourceCount });
    dispatch(updateFeedback({ classes: 'info-notice', open: true, message }));
  },
});

function validate() {
  const errors = {};
  return errors;
}

const reduxFormConfig = {
  form: 'collectionForm', // make sure this matches the sub-components and other wizard steps
  validate,
};

export default
withIntlForm(
  reduxForm(reduxFormConfig)(
    connect(mapStateToProps, mapDispatchToProps)(
      CollectionMediaForm
    )
  )
);
