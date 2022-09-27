from server import mc, TOOL_API_KEY
from server.cache import cache
from server.auth import user_admin_mediacloud_client
from server.views.explorer import dates_as_filter_query
from server.util.api_helper import combined_split_and_normalized_counts, add_missing_dates_to_split_story_counts
from server.util.tags import processed_for_entities_query_clause, processed_for_themes_query_clause, \
    TagSetDiscoverer
import server.views.apicache as base_apicache
from server.views import TAG_SAMPLE_SIZE, TAG_COUNT_SAMPLE_SIZE

from mediacloud.error import MCException

def normalized_and_story_count(q, fq, open_q):
    return {
        'total': base_apicache.story_count(q, fq)['count'],
        'normalized_total': base_apicache.story_count(open_q, fq)['count'],
    }


def normalized_and_story_split_count(q, open_q, start_date, end_date):
    fq = dates_as_filter_query(start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"))
    matching = base_apicache.story_count(q, fq, split=True)
    matching = add_missing_dates_to_split_story_counts(matching['counts'], start_date, end_date)
    total = base_apicache.story_count(open_q, fq, split=True)
    total = add_missing_dates_to_split_story_counts(total['counts'], start_date, end_date)
    return {
        'counts': combined_split_and_normalized_counts(matching, total),
        'total': sum([day['count'] for day in matching]),
        'normalized_total': sum([day['count'] for day in total]),
    }


def sentence_list(q, fq=None, rows=1000, include_stories=True):
    # can't cache by user api key here because we need to use tool mc to get sentences (ie. admin only)
    return _cached_sentence_list(TOOL_API_KEY, q, fq, rows, include_stories)


@cache.cache_on_arguments()
def _cached_sentence_list(mc_api_key, q, fq, rows, include_stories=True):
    # need to get an admin client with the tool key so they have sentence read permissions
    tool_mc = user_admin_mediacloud_client(mc_api_key)
    sentences = tool_mc.sentenceList(q, fq, sort=mc.SORT_RANDOM)[:rows]
    stories_id_list = [str(s['stories_id']) for s in sentences]
    if (len(stories_id_list) > 0) and include_stories:
        # this is the fastest way to get a list of stories by id
        try:
            stories = base_apicache.story_list(mc_api_key, "stories_id:({})".format(" ".join(stories_id_list)), None)
            stories_by_id = {s['stories_id']: s for s in stories}  # build a quick lookup table by stories_id
            for s in sentences:
                s['story'] = stories_by_id[s['stories_id']]
        except MCException:
            for s in sentences:
                s['story'] = None
    return sentences


def top_tags_with_coverage(q, fq, tag_sets_id, limit=TAG_SAMPLE_SIZE):
    tag_counts = base_apicache.top_tags(q, fq, tag_sets_id, sample_size=TAG_COUNT_SAMPLE_SIZE)
    if int(tag_sets_id) in [TagSetDiscoverer().cliff_places_set, TagSetDiscoverer().cliff_orgs_set, TagSetDiscoverer().cliff_people_set]:
        coverage = base_apicache.tag_set_coverage(q, '({}) AND {}'.format(q, processed_for_entities_query_clause()), fq)
    elif int(tag_sets_id) == TagSetDiscoverer().nyt_themes_set:
        coverage = base_apicache.tag_set_coverage(q, '({}) AND {}'.format(q, processed_for_themes_query_clause()), fq)
    else:
        raise RuntimeError("Unknown tag_sets_id for computing coverage: {}".format(tag_sets_id))
    for t in tag_counts:  # add in pct of what's been run through CLIFF to total results
        try:
            t['pct'] = float(t['count']) / coverage['counts']
        except ZeroDivisionError:
            t['pct'] = 0
    coverage['results'] = tag_counts[:limit]
    return coverage
