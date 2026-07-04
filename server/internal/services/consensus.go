package services

import (
	"errors"
	"math"
	"sort"
	"strconv"

	"github.com/msi/bm-planning/server/internal/models"
)

type ConsensusResult struct {
	Average       *float64
	Median        *float64
	SuggestedCard *string
}

func CalculateConsensus(
	round *models.VotingRound,
	participants map[string]models.User,
	deck []string,
	algorithm models.ConsensusAlgorithm,
) (ConsensusResult, error) {
	if round == nil {
		return ConsensusResult{}, errors.New("round is required")
	}

	numericVotes := make([]float64, 0, len(round.Votes))
	for _, vote := range round.Votes {
		user, ok := participants[vote.UserID]
		if !ok || !user.CanVote {
			continue
		}
		parsed, err := strconv.ParseFloat(vote.Value, 64)
		if err != nil {
			continue
		}
		numericVotes = append(numericVotes, parsed)
	}

	if len(numericVotes) == 0 || algorithm == models.ConsensusAlgorithmManual {
		return ConsensusResult{}, nil
	}

	sort.Float64s(numericVotes)
	avg := average(numericVotes)
	med := median(numericVotes)

	result := ConsensusResult{
		Average: &avg,
		Median:  &med,
	}

	var source float64
	if algorithm == models.ConsensusAlgorithmMedianNearest {
		source = med
	} else {
		source = avg
	}

	if suggested := nearestDeckValue(source, deck); suggested != nil {
		result.SuggestedCard = suggested
	}

	return result, nil
}

/** Compute the arithmetic mean of numeric vote values.
 *
 * @param values - Sorted or unsorted numeric values; must be non-empty.
 * @returns Average value.
 */
func average(values []float64) float64 {
	var sum float64
	for _, value := range values {
		sum += value
	}
	return sum / float64(len(values))
}

/** Compute the median of numeric vote values.
 *
 * @param values - Numeric values; empty slice returns zero.
 * @returns Median value.
 */
func median(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	mid := len(values) / 2
	if len(values)%2 == 0 {
		return (values[mid-1] + values[mid]) / 2
	}
	return values[mid]
}

/** Find the deck card whose numeric value is closest to the target.
 *
 * @param value - Target numeric value (average or median).
 * @param deck - Allowed deck card labels.
 * @returns Closest deck label, or nil when no numeric deck cards exist.
 */
func nearestDeckValue(value float64, deck []string) *string {
	var (
		bestCard *string
		bestDiff = math.MaxFloat64
	)
	for _, card := range deck {
		parsed, err := strconv.ParseFloat(card, 64)
		if err != nil {
			continue
		}
		diff := math.Abs(value - parsed)
		if diff < bestDiff {
			cardCopy := card
			bestCard = &cardCopy
			bestDiff = diff
		}
	}
	return bestCard
}
