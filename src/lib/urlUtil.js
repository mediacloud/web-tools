import { getBrandDarkerColor } from '../styles/colors';

// internal tag used to get the hostname from a url
const tempATag = document.createElement('a');

// return the URL to the favicon for a website domain
export function googleFavIconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}`;
}

// return our best guess for the domain name of a story
export function storyDomainName(story) {
  // use guid unless it isn't a url
  if ({}.hasOwnProperty.call(story, 'guid')) {
    tempATag.href = (story.guid.startsWith('http')) ? story.guid : story.url;
  } else {
    tempATag.href = story.url;
  }
  // get the domain without any subdomain
  const domain = tempATag.hostname.split('.').slice(-2).join('.');
  return domain;
}

export function urlToCollection(collectionId) {
  return `https://sources.mediacloud.org/#/collections/${collectionId}`;
}

export function urlToSource(mediaId) {
  return `https://sources.mediacloud.org/#/sources/${mediaId}`;
}

export function urlToDashboardQuery(name, keywords, sourceIds, collectionIds, startDate, endDate) {
  const mediaInfo = {};
  if (sourceIds && sourceIds.length > 0) {
    mediaInfo.sources = sourceIds;
  }
  if (collectionIds && collectionIds.length > 0) {
    mediaInfo.sets = collectionIds;
  }
  const startDateStr = startDate;
  const endDateStr = endDate;
  return `https://dashboard.mediacloud.org/#query/["${keywords}"]/[${JSON.stringify(mediaInfo)}]/["${startDateStr}"]/["${endDateStr}"]/[{"uid":1,"name":"${name}","color":"${getBrandDarkerColor().substr(1)}"}]`;
}

export function urlToExplorerQuery(name, keywords, sourceIds, collectionIds, startDate, endDate) {
  return `https://explorer.mediacloud.org/#/queries/search?q=[{"label":"${name}","q":"${keywords}","color":"${getBrandDarkerColor().substr(1)}","startDate":"${startDate}","endDate":"${endDate}","sources":${JSON.stringify(sourceIds)},"collections":${JSON.stringify(collectionIds)}}]`;
}
