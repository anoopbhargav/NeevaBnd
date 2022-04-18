import os
import sys
import json

import numpy
from sklearn.metrics import dcg_score


def get_single_side_ndcg(rating_pairs, best_dcg):
    """ Computes ndcg for a single side normalizing by the best dcg """
    rating_pairs.sort(key=lambda x: x[0])
    ranks, ratings_base = zip(*rating_pairs)
    ratings = numpy.array([ratings_base])
    scores = numpy.array([[1 / (i + 2) for i in ranks]])
    if best_dcg == 0.0:
        return 0.0
    return round(float(dcg_score(ratings, scores) / best_dcg), 3)


def get_ndcg(control_rating_pairs, experiment_rating_pairs, all_ratings):
    """ Compute the NDCG for experiments normalizing with a union of the two result sets. """
    if len(all_ratings) == 0:
        return 0.0, 0.0
    if len(all_ratings) == 1:
        return (
            float(len(control_rating_pairs) == 1),
            float(len(experiment_rating_pairs) == 1),
        )
    # Computes the best rating order
    best_ratings = numpy.array([sorted(all_ratings, reverse=True)])
    best_scores = numpy.array([[1 / (i + 2) for i in range(len(all_ratings))]])
    best_dcg = dcg_score(best_ratings, best_scores)

    control_ndcg = get_single_side_ndcg(control_rating_pairs, best_dcg)

    if len(experiment_rating_pairs) == 0:
        return control_ndcg, None
    experiment_ndcg = get_single_side_ndcg(experiment_rating_pairs, best_dcg)
    return control_ndcg, experiment_ndcg


if __name__ == '__main__':
    try:
        print("starting python")
        # print(sys.argv)

        lines = sys.stdin.readlines()
        # print(" Lines : ")
        # print(lines)

        print("arg1 " + lines[0])
        print("arg2 " + lines[1])
        print("arg3 " + lines[2])
        control_rating_pairs = json.loads(lines[0])
        control_rating_pairs = control_rating_pairs['rating'][0]
        # print(control_rating_pairs)
        control_rating_pairs_list = list(control_rating_pairs.items())
        control_rating_pairs_list = [
            (int(k), float(v)) for k, v in control_rating_pairs.items()]
        print("control_data : ")
        print(control_rating_pairs_list)

        experiment_rating_pairs = json.loads(lines[1])
        experiment_rating_pairs = experiment_rating_pairs['rating'][0]
        experiment_rating_pairs_list = list(experiment_rating_pairs.items())
        experiment_rating_pairs_list = [
            (int(k), float(v)) for k, v in experiment_rating_pairs.items()]
        print("experiment_data : ")
        print(experiment_rating_pairs_list)

        all_ratings_string = json.loads(lines[2])
        all_ratings_list = all_ratings_string['rating']
        all_ratings_list = [float(i) for i in all_ratings_list]
        print("all_rating_data : ")
        print(all_ratings_list)

    except Exception as e:
        print("error in building ndcg parameters : ")
        print(e)
    else:
        try:
            print("starting ndcg computation")
            control_ndcg, experiment_ndcg = get_ndcg(
                control_rating_pairs_list, experiment_rating_pairs_list, all_ratings_list)
        except Exception as e:
            print("error in computing ndcg")
            print(e)
        else:
            try:
                print("result control : ")
                print(control_ndcg)
                print("result experiment : ")
                print(experiment_ndcg)

                dict_ndcg = {
                    "final": "true",
                    "controlVal": control_ndcg,
                    "experimentVal": experiment_ndcg
                }
                print(json.dumps(dict_ndcg))
            except Exception as e:
                print("error in building ndcg response object")
                print(e)
