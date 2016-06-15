import React from 'react';
import Title from 'react-title-component';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import LoadingSpinner from '../../util/LoadingSpinner';
import TopicInfo from './TopicInfo';
import TopicTopStoriesContainer from './TopicTopStoriesContainer';
import TopicTopMediaContainer from './TopicTopMediaContainer';
import TopicTopWordsContainer from './TopicTopWordsContainer';
import TopicSentenceCountContainer from './TopicSentenceCountContainer';
import messages from '../../../resources/messages';
import { Grid, Row, Col } from 'react-flexbox-grid/lib';

class TopicSummaryContainer extends React.Component {
  getStyles() {
    const styles = {
      root: {
      },
      row: {
        marginBottom: 15,
      },
    };
    return styles;
  }
  filtersAreSet() {
    const { filters, topicId } = this.props;
    return ((topicId !== null) && (filters.snapshotId !== null) && (filters.timespanId !== null));
  }
  render() {
    const { filters, topicId, topicInfo } = this.props;
    const { formatMessage } = this.props.intl;
    const title = formatMessage(messages.topicName);
    const titleHandler = parentTitle => `${title} | ${parentTitle}`;
    const styles = this.getStyles();
    let content = <div />;
    let subContent = <div />;
    if (this.filtersAreSet()) {
      subContent = (
        <Grid>
          <Row style={styles.row}>
            <Col lg={6}>
              <TopicSentenceCountContainer topicId={topicId} filters={filters} />
            </Col>
            <Col lg={6}>
              <TopicTopWordsContainer topicId={topicId} filters={filters} />
            </Col>
          </Row>
          <Row style={styles.row}>
            <Col lg={6}>
              <TopicTopMediaContainer topicId={topicId} filters={filters} />
            </Col>
            <Col lg={6}>
              <TopicTopStoriesContainer topicId={topicId} filters={filters} />
            </Col>
          </Row>
          <Row style={styles.row}>
            <Col lg={6}>
              <TopicInfo topic={topicInfo} />
            </Col>
            <Col lg={6} />
          </Row>
        </Grid>
      );
    } else {
      subContent = <LoadingSpinner />;
    }
    content = (
      <div>
        {subContent}
      </div>
    );
    return (
      <div style={styles.root}>
        <Title render={titleHandler} />
        <div>
          {content}
        </div>
      </div>
    );
  }
}

TopicSummaryContainer.propTypes = {
  intl: React.PropTypes.object.isRequired,
  filters: React.PropTypes.object.isRequired,
  params: React.PropTypes.object.isRequired,       // params from router
  topicId: React.PropTypes.number,
  topicInfo: React.PropTypes.object,
};

const mapStateToProps = (state) => ({
  filters: state.topics.selected.filters,
  topicId: state.topics.selected.id,
  topicInfo: state.topics.selected.info,
});

export default injectIntl(connect(
  mapStateToProps,
  null
)(TopicSummaryContainer));
