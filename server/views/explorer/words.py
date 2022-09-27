import logging
from flask import jsonify, request
import flask_login
import json
import requests.exceptions

from server import app
from server.views import WORD_COUNT_SAMPLE_SIZE, WORD_COUNT_DOWNLOAD_NUM_WORDS, WORD_COUNT_UI_NUM_WORDS
from server.util.request import api_error_handler
import server.util.csv as csv
from server.views.explorer import parse_query_with_keywords, file_name_for_download
import server.views.apicache as base_apicache

logger = logging.getLogger(__name__)


@app.route('/api/explorer/words/count', methods=['POST'])
@flask_login.login_required
@api_error_handler
def api_explorer_words():
    return _get_word_count()


def _get_word_count():
    sample_size = int(request.form['sampleSize']) if 'sampleSize' in request.form else WORD_COUNT_SAMPLE_SIZE
    solr_q, solr_fq = parse_query_with_keywords(request.form)
    word_data = query_wordcount(solr_q, solr_fq, sample_size=sample_size)
    # return combined data
    return jsonify({"results": word_data, "sample_size": str(sample_size)})


# if this is a sample search, we will have a search id and a query index
# if this is a custom search, we will have a query will q,start_date, end_date, sources and collections
@app.route('/api/explorer/words/wordcount.csv', methods=['POST'])
@flask_login.login_required
@api_error_handler
def explorer_wordcount_csv():
    data = request.form
    ngram_size = data['ngramSize'] if 'ngramSize' in data else 1    # default to words if ngram not specified
    sample_size = data['sample_size'] if 'sample_size' in data else WORD_COUNT_SAMPLE_SIZE
    filename = 'sampled-{}-ngrams-{}'.format(sample_size, ngram_size)
    query_object = json.loads(data['q'])
    solr_q, solr_fq = parse_query_with_keywords(query_object)
    filename = file_name_for_download(query_object['label'], filename)
    return stream_wordcount_csv(filename, solr_q, solr_fq, ngram_size, sample_size)


@app.route('/api/explorer/words/compare/count', methods=['POST'])
@flask_login.login_required
@api_error_handler
def api_explorer_compare_words():
    compared_queries = request.args['compared_queries[]'].split(',')
    results = []
    for cq in compared_queries:
        dictq = {x[0]: x[1] for x in [x.split("=") for x in cq[1:].split("&")]}
        solr_q, solr_fq = parse_query_with_keywords(dictq)
        word_count_result = query_wordcount(solr_q, solr_fq)
        results.append(word_count_result)
    return jsonify({"list": results})


def query_wordcount(q, fq, ngram_size=1, num_words=WORD_COUNT_UI_NUM_WORDS, sample_size=WORD_COUNT_SAMPLE_SIZE):
    word_data = base_apicache.word_count(q, fq, ngram_size=ngram_size, num_words=num_words, sample_size=sample_size)
    # add in word2vec results
    words = [w['term'] for w in word_data]
    # and now add in word2vec model position data
    if len(words) > 0:
        try:
            google_word2vec_data = base_apicache.word2vec_google_2d(words)
            for i in range(len(google_word2vec_data)):
                word_data[i]['google_w2v_x'] = google_word2vec_data[i]['x']
                word_data[i]['google_w2v_y'] = google_word2vec_data[i]['y']
        except requests.exceptions.ConnectionError as ce:
            logger.exception(ce)
            # maybe the server is down? just return the counts at least so they render right
            for w in word_data:
                w['google_w2v_x'] = 0
                w['google_w2v_y'] = 0
    return word_data


def stream_wordcount_csv(filename, q, fq, ngram_size=1, sample_size=WORD_COUNT_SAMPLE_SIZE):
    # use bigger values for CSV download
    num_words = WORD_COUNT_DOWNLOAD_NUM_WORDS
    word_counts = query_wordcount(q, fq, ngram_size, num_words, sample_size)
    for w in word_counts:
        w['sample_size'] = sample_size
        w['ratio'] = float(w['count'])/float(sample_size)
    props = ['term', 'stem', 'count', 'sample_size', 'ratio', 'google_w2v_x', 'google_w2v_y']
    return csv.stream_response(word_counts, props, filename)
