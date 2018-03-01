import logging
from flask import jsonify, request
import flask_login
import json

from server import app, mc
from server.cache import cache, key_generator
from server.auth import is_user_logged_in, user_mediacloud_key, user_mediacloud_client
from server.util.request import api_error_handler
import server.util.csv as csv
from server.views.explorer import parse_as_sample, parse_query_with_args_and_sample_search, parse_query_with_keywords, load_sample_searches
import server.views.explorer.apicache as apicache

# load the shared settings file
DEFAULT_NUM_WORDS = 100
DEFAULT_SAMPLE_SIZE = 5000

logger = logging.getLogger(__name__)


@app.route('/api/explorer/words/count', methods=['GET'])
@flask_login.login_required
@api_error_handler
def api_explorer_words():
    return get_word_count()


@app.route('/api/explorer/demo/words/count', methods=['GET'])
@api_error_handler
def api_explorer_demo_words():
    return get_word_count()


def get_word_count():
    search_id = int(request.args['search_id']) if 'search_id' in request.args else None
    if search_id not in [None, -1]:
        sample_searches = load_sample_searches()
        current_search = sample_searches[search_id]['queries']
        solr_query = parse_query_with_args_and_sample_search(request.args, current_search)
    else:
        solr_query = parse_query_with_keywords(request.args)
    word_data = query_wordcount(solr_query)
    # add in word2vec results
    words = [w['term'] for w in word_data]
    # and now add in word2vec model position data
    google_word2vec_data = apicache.word2vec_google_2d(words)
    for i in range(len(google_word2vec_data)):
        word_data[i]['google_w2v_x'] = google_word2vec_data[i]['x']
        word_data[i]['google_w2v_y'] = google_word2vec_data[i]['y']
    # return combined data
    return jsonify({"list": word_data})


# if this is a sample search, we will have a search id and a query index
# if this is a custom search, we will have a query will q,start_date, end_date, sources and collections
@app.route('/api/explorer/words/wordcount.csv/<search_id_or_query>/<index>', methods=['GET'])
@api_error_handler
def explorer_wordcount_csv(search_id_or_query, index):
    ngram_size = request.args['ngram_size'] if 'ngram_size' in request.args else 1
    try:
        search_id = int(search_id_or_query)
        if search_id >= 0: # this is a sample query
            solr_query = parse_as_sample(search_id, index)

    except Exception as e:
        # planned exception if search_id is actually a keyword or query
        # csv downloads are 1:1 - one query to one download, so we can use index of 0
        query_or_keyword = search_id_or_query
        current_query = json.loads(query_or_keyword)[0]
        solr_query = parse_query_with_keywords(current_query)

    return stream_wordcount_csv('Explorer-wordcounts-ngrams-{}'.format(ngram_size), solr_query, ngram_size)


@app.route('/api/explorer/words/compare/count', methods=['GET'])
@flask_login.login_required
@api_error_handler
def api_explorer_compare_words():
    compared_queries = request.args['compared_queries[]'].split(',')
    results = []
    for cq in compared_queries:
        dictq = {x[0]: x[1] for x in [x.split("=") for x in cq[1:].split("&")]}
        solr_query = parse_query_with_keywords(dictq)
        word_count_result = query_wordcount(solr_query)
        results.append(word_count_result)
    return jsonify({"list": results})  


@app.route('/api/explorer/demo/words/compare/count')
@api_error_handler
def api_explorer_demo_compare_words():
    search_id = int(request.args['search_id']) if 'search_id' in request.args else None
    
    if search_id not in [None, -1]:
        sample_searches = load_sample_searches()
        compared_sample_queries = sample_searches[search_id]['queries']
        results = []
        for cq in compared_sample_queries:
            solr_query = parse_query_with_keywords(cq)
            word_count_result = query_wordcount(solr_query)
            results.append(word_count_result)
    else:
        compared_queries = request.args['compared_queries[]'].split(',')
        results = []
        for cq in compared_queries:
            dictq = {x[0]:x[1] for x in [x.split("=") for x in cq[1:].split("&")]}
            solr_query = parse_query_with_keywords(dictq)
            word_count_result = query_wordcount(solr_query)
            results.append(word_count_result)

    return jsonify({"list": results})


def query_wordcount(query, ngram_size=1, num_words=DEFAULT_NUM_WORDS, sample_size=DEFAULT_SAMPLE_SIZE):
    return apicache.word_count(query, ngram_size, num_words, sample_size)


def stream_wordcount_csv(filename, query, ngram_size=1):
    # use bigger values for CSV download
    num_words = 500
    sample_size = 10000
    word_counts = query_wordcount(query, ngram_size, num_words, sample_size)
    for w in word_counts:
        w['sample_size'] = sample_size
        w['ratio'] = float(w['count'])/float(sample_size)
    props = ['term', 'stem', 'count', 'sample_size', 'ratio']
    return csv.stream_response(word_counts, props, filename)
