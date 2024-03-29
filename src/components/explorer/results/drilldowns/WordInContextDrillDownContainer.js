import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import MenuItem from '@material-ui/core/MenuItem';
import slugify from 'slugify';
import { Row, Col } from 'react-flexbox-grid/lib';
import ActionMenu from '../../../common/ActionMenu';
import { fetchWordSampleSentences, resetSelectedWord } from '../../../../actions/explorerActions';
import withHelp from '../../../common/hocs/HelpfulContainer';
import withAsyncData from '../../../common/hocs/AsyncDataContainer';
import DataCard from '../../../common/DataCard';
import WordTree from '../../../vis/WordTree';
import messages from '../../../../resources/messages';
import { downloadSvg } from '../../../util/svg';
import { updateFeedback } from '../../../../actions/appActions';

const localMessages = {
  title: { id: 'word.inContext.title', defaultMessage: 'Word in Context: {word}' },
  helpTitle: { id: 'word.inContext.help.title', defaultMessage: 'About Word in Context' },
  helpText: { id: 'word.inContext.help.text',
    defaultMessage: '<p>It is helpful to look at how a word is used, in addition to the fact that it is used.  While a word cloud can tell you what words are used, this interactive visualization can help you explore the use of a word in context.</p>',
  },
  close: { id: 'word.inContext.close', defaultMessage: 'Close' },
  addWordToAllQueries: { id: 'word.inContext.addWordToAllQueries', defaultMessage: 'Add This Word To All Queries' },
  addingToQueries: { id: 'explorer.topWords.addingToQueries', defaultMessage: 'Added {word} to all queries. Running your updated search now.' },
};

class WordInContextDrillDownContainer extends React.Component {
  constructor(props) {
    super(props);
    this.rootRef = React.createRef();
  }

  shouldComponentUpdate(nextProps) {
    const { selectedWord, fragments } = this.props;
    return (nextProps.selectedWord !== selectedWord) || (nextProps.fragments !== fragments);
  }

  componentDidUpdate(prevProps) {
    const { selectedWord } = this.props;
    const prevSelectedWord = prevProps.selectedWord;
    const rootNode = this.rootRef;
    // have to treat this node carefully, because it might not be showing
    if (rootNode && rootNode.current && selectedWord && (selectedWord !== prevSelectedWord)) {
      rootNode.current.scrollIntoView();
    }
  }

  getUniqueDomId = () => 'word-in-context-';

  handleDownloadSvg = () => {
    const { selectedWord } = this.props;
    // a little crazy, but it works (we have to just walk the DOM rendered by the library we are using)
    const domId = this.getUniqueDomId();
    const svgNode = document.getElementById(domId).children[0].children[0].children[0].children[0];
    const svgDownloadPrefix = `${slugify(selectedWord.word)}-in-context`;
    downloadSvg(svgDownloadPrefix, svgNode);
  }

  render() {
    const { selectedWord, handleAddToAllQueries, handleClose, fragments, helpButton } = this.props;
    const uniqueDomId = this.getUniqueDomId();

    let content = null;
    if (selectedWord) {
      content = (
        <div className="drill-down" ref={this.rootRef}>
          <DataCard className="query-word-drill-down">
            <ActionMenu>
              <MenuItem
                className="action-icon-menu-item"
                onClick={handleClose}
              >
                <FormattedMessage {...localMessages.close} />
              </MenuItem>
              <MenuItem
                className="action-icon-menu-item"
                onClick={() => {
                  const wordToAdd = selectedWord.word;
                  handleClose();
                  handleAddToAllQueries(wordToAdd);
                }}
              >
                <FormattedMessage {...localMessages.addWordToAllQueries} />
              </MenuItem>
              <MenuItem
                className="action-icon-menu-item"
                onClick={this.handleDownloadSvg}
              >
                <FormattedMessage {...messages.downloadSVG} />
              </MenuItem>
            </ActionMenu>
            <h2>
              <FormattedMessage {...localMessages.title} values={{ word: selectedWord.word }} />
              {helpButton}
            </h2>
            <Row>
              <Col lg={12}>
                <WordTree
                  domId={uniqueDomId}
                  sentences={fragments}
                  startWord={selectedWord.word}
                  height="400px"
                  width="700px"
                />
              </Col>
            </Row>
          </DataCard>
        </div>
      );
    }
    return content;
  }
}

WordInContextDrillDownContainer.propTypes = {
  // from parent
  lastSearchTime: PropTypes.number.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  // from store
  fetchStatus: PropTypes.string.isRequired,
  selectedWord: PropTypes.object,
  fragments: PropTypes.array,
  // from dispatch
  handleAddToAllQueries: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  // from context
  intl: PropTypes.object.isRequired,
  helpButton: PropTypes.node.isRequired,
  onQueryModificationRequested: PropTypes.func.isRequired,
};


const mapStateToProps = state => ({
  fetchStatus: state.explorer.sampleSentencesByWord.fetchStatus,
  selectedWord: state.explorer.topWords.selectedWord,
  fragments: state.explorer.sampleSentencesByWord.results,
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  handleAddToAllQueries: (word) => {
    ownProps.onQueryModificationRequested(word);
    dispatch(updateFeedback({ classes: 'info-notice', open: true, message: ownProps.intl.formatMessage(localMessages.addingToQueries, { word }) }));
  },
  handleClose: () => {
    dispatch(resetSelectedWord());
  },
});

const fetchAsyncData = (dispatch, { selectedWord }) => dispatch(fetchWordSampleSentences(selectedWord));

export default
injectIntl(
  connect(mapStateToProps, mapDispatchToProps)(
    withHelp(localMessages.helpTitle, [localMessages.helpText, messages.wordTreeHelpText])(
      withAsyncData(fetchAsyncData, ['selectedWord'])(
        WordInContextDrillDownContainer
      )
    )
  )
);
