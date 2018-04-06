import PropTypes from 'prop-types';
import React from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import composeAsyncContainer from '../../../common/AsyncContainer';
import { fetchCollectionList } from '../../../../actions/sourceActions';
import TitledCollectionTable from './TitledCollectionTable';
import { TAG_SET_MC_ID } from '../../../../lib/tagUtil';

const MCCollectionListContainer = (props) => {
  const { name, description, collections, user } = props;
  return (
    <div className="mc-collections-table">
      <TitledCollectionTable
        collections={collections}
        title={name}
        description={description}
        user={user}
      />
    </div>
  );
};

MCCollectionListContainer.propTypes = {
  // from state
  collections: PropTypes.array.isRequired,
  name: PropTypes.string,
  description: PropTypes.string,
  user: PropTypes.object.isRequired,
  fetchStatus: PropTypes.string.isRequired,
  // from context
  intl: PropTypes.object.isRequired,
  // from dispatch
  asyncFetch: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  fetchStatus: state.sources.collections.all.fetchStatus,
  name: state.sources.collections.all.name,
  description: state.sources.collections.all.description,
  collections: state.sources.collections.all.collections,
  user: state.user,
});

const mapDispatchToProps = dispatch => ({
  asyncFetch: () => {
    dispatch(fetchCollectionList(TAG_SET_MC_ID));
  },
});

export default
  injectIntl(
    connect(mapStateToProps, mapDispatchToProps)(
      composeAsyncContainer(
        MCCollectionListContainer
      )
    )
  );
