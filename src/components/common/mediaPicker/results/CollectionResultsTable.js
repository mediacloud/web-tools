import PropTypes from 'prop-types';
import { injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import React from 'react';
import { AddButton, DeleteButton } from '../../IconButton';
import { urlToCollection } from '../../../../lib/urlUtil';

const localMessages = {
  name: { id: 'mediaPicker.searchResults.name', defaultMessage: 'Name' },
  tagSetLabel: { id: 'mediaPicker.searchResults.tagSetLabel', defaultMessage: 'Category' },
  description: { id: 'mediaPicker.searchResults.description', defaultMessage: 'Description' },
  storiesLastWeek: { id: 'mediaPicker.searchResults.storiesLastWeek', defaultMessage: 'Stories Last Week' },
  mediaSources: { id: 'mediaPicker.searchResults.mediaSources', defaultMessage: 'Media Sources' },
  noResults: { id: 'mediaPicker.searchResults.noResults', defaultMessage: 'No matching collections' },
};

const CollectionResultsTable = (props) => {
  const { title, collections, handleToggleAndSelectMedia } = props;
  let content = null;
  if (collections.length > 0) {
    content = (
      <table>
        <tbody>
          <tr>
            <th><FormattedMessage {...localMessages.name} /></th>
            <th><FormattedMessage {...localMessages.tagSetLabel} /></th>
            <th><FormattedMessage {...localMessages.description} /></th>
            <th className="numeric"><FormattedMessage {...localMessages.storiesLastWeek} /></th>
            <th className="numeric"><FormattedMessage {...localMessages.mediaSources} /></th>
            <th />
          </tr>
          {collections.map((c, idx) => {
            const ActionButton = c.selected ? DeleteButton : AddButton;
            const actionContent = <ActionButton onClick={() => handleToggleAndSelectMedia(c)} />;
            return (
              <tr key={`${c.tags_id}`} className={(idx % 2 === 0) ? 'even' : 'odd'}>
                <td><a href={urlToCollection(c.tags_id)} target="new">{c.name}</a></td>
                <td>{c.tag_set_label}</td>
                <td>{c.description}</td>
                <td className="numeric"><FormattedNumber value={c.story_count} /></td>
                <td className="numeric">{(c.media_count === 100) ? `${c.media_count}+` : c.media_count}</td>
                <td>{actionContent}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  } else {
    content = <FormattedMessage {...localMessages.noResults} />;
  }
  return (
    <div>
      <h2>{title}</h2>
      {content}
    </div>
  );
};

CollectionResultsTable.propTypes = {
  // from content
  intl: PropTypes.object,
  // from parent
  title: PropTypes.string,
  collections: PropTypes.array,
  handleToggleAndSelectMedia: PropTypes.func,
};

export default
  injectIntl(
    CollectionResultsTable
  );

