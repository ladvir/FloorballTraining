using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.Trainings.Interfaces;

namespace FloorballTraining.UseCases.Trainings;

public class TrainingSimilarityService(ITrainingRepository repository) : ITrainingSimilarityService
{
    private const double TierBThreshold = 0.75;
    private const double TierADurationTolerance = 0.15;

    public async Task<List<SimilarTrainingDto>> FindSimilarForAsync(
        TrainingDto draft,
        string? authorUserId,
        IReadOnlyCollection<string>? clubMemberUserIds)
    {
        var draftDurations = TrainingSimilarity.GetActivityDurations(draft);
        if (draftDurations.Count == 0) return [];

        var draftSignature = TrainingSimilarity.ComputeSignature(draft);
        var excludeId = draft.Id > 0 ? draft.Id : (int?)null;

        // clubMemberUserIds == null means no user scope → search across ALL trainings (admin path).
        // Non-null = explicit user scope; authorUserId is folded in so the caller's own trainings are always considered.
        IReadOnlyCollection<string>? repoScope;
        if (clubMemberUserIds == null)
        {
            repoScope = null;
        }
        else
        {
            var scope = new HashSet<string>(StringComparer.Ordinal);
            if (!string.IsNullOrEmpty(authorUserId)) scope.Add(authorUserId);
            foreach (var id in clubMemberUserIds) scope.Add(id);
            if (scope.Count == 0) return [];
            repoScope = scope;
        }

        var candidates = await repository.GetSimilarityCandidatesAsync(repoScope, excludeId);

        var results = new List<SimilarTrainingDto>();
        foreach (var c in candidates)
        {
            var (tier, score) = Score(draftDurations, draft.Duration, draftSignature, c);
            if (tier == null) continue;

            results.Add(new SimilarTrainingDto
            {
                Id = c.Id,
                Name = c.Name,
                IsDraft = c.IsDraft,
                Duration = c.Duration,
                CreatedByUserId = c.CreatedByUserId,
                Tier = tier.Value.ToString(),
                Score = score,
                MatchedByAuthor = c.CreatedByUserId == authorUserId,
                MatchedByClub = clubMemberUserIds != null && c.CreatedByUserId != null && clubMemberUserIds.Contains(c.CreatedByUserId),
                AppointmentCount = c.AppointmentCount
            });
        }

        return results
            .OrderBy(r => r.Tier)
            .ThenByDescending(r => r.Score)
            .ToList();
    }

    public async Task<List<DuplicateGroupDto>> FindDuplicateGroupsAsync(
        SimilarityTier tier,
        IReadOnlyCollection<string>? userIdScope)
    {
        var candidates = await repository.GetSimilarityCandidatesAsync(userIdScope, excludeId: null);
        var meaningful = candidates.Where(c => c.ActivityDurations.Count > 0).ToList();

        return tier switch
        {
            SimilarityTier.A => GroupTierA(meaningful),
            SimilarityTier.B => GroupTierB(meaningful),
            _ => []
        };
    }

    private static List<DuplicateGroupDto> GroupTierA(List<SimilarityCandidate> candidates)
    {
        var byKey = candidates
            .Where(c => !string.IsNullOrEmpty(c.ActivitySignature))
            .GroupBy(c => c.ActivitySignature!)
            .Where(g => HasDurationDuplicate(g.ToList()))
            .ToList();

        var result = new List<DuplicateGroupDto>();
        foreach (var g in byKey)
        {
            var rows = g.ToList();
            var matchingRows = ExtractDurationCluster(rows);
            if (matchingRows.Count < 2) continue;

            result.Add(new DuplicateGroupDto
            {
                GroupKey = g.Key,
                Tier = nameof(SimilarityTier.A),
                MinScore = 1.0,
                Trainings = matchingRows.Select(c => Map(c, SimilarityTier.A, 1.0)).ToList()
            });
        }
        return result.OrderByDescending(g => g.Trainings.Count).ToList();
    }

    private static bool HasDurationDuplicate(List<SimilarityCandidate> rows)
        => rows.Count >= 2 && ExtractDurationCluster(rows).Count >= 2;

    private static List<SimilarityCandidate> ExtractDurationCluster(List<SimilarityCandidate> rows)
    {
        // Within a same-signature group, keep all trainings whose duration is within ±15% of any other in the group.
        // Practically: pick the largest cluster of rows mutually within tolerance.
        var best = new List<SimilarityCandidate>();
        for (var i = 0; i < rows.Count; i++)
        {
            var anchor = rows[i];
            var cluster = rows
                .Where(r => TrainingSimilarity.IsTierADuration(anchor.Duration, r.Duration, TierADurationTolerance))
                .ToList();
            if (cluster.Count > best.Count) best = cluster;
        }
        return best;
    }

    private static List<DuplicateGroupDto> GroupTierB(List<SimilarityCandidate> candidates)
    {
        // Edge list: pairs with weighted-time Jaccard >= threshold and not already a Tier A duplicate.
        var n = candidates.Count;
        var parent = Enumerable.Range(0, n).ToArray();
        var pairScores = new Dictionary<(int, int), double>();

        int Find(int x) { while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
        void Union(int a, int b) { var ra = Find(a); var rb = Find(b); if (ra != rb) parent[ra] = rb; }

        for (var i = 0; i < n; i++)
        {
            for (var j = i + 1; j < n; j++)
            {
                // Skip pure Tier A duplicates (same signature + duration within tolerance) — they belong to Tier A view.
                var sameSig = candidates[i].ActivitySignature != null
                    && candidates[i].ActivitySignature == candidates[j].ActivitySignature
                    && TrainingSimilarity.IsTierADuration(candidates[i].Duration, candidates[j].Duration, TierADurationTolerance);
                if (sameSig) continue;

                var score = TrainingSimilarity.WeightedTimeJaccard(candidates[i].ActivityDurations, candidates[j].ActivityDurations);
                if (score < TierBThreshold) continue;

                pairScores[(i, j)] = score;
                Union(i, j);
            }
        }

        var groups = new Dictionary<int, List<int>>();
        for (var i = 0; i < n; i++)
        {
            if (!pairScores.Keys.Any(k => k.Item1 == i || k.Item2 == i)) continue;
            var root = Find(i);
            if (!groups.TryGetValue(root, out var list)) { list = []; groups[root] = list; }
            list.Add(i);
        }

        var result = new List<DuplicateGroupDto>();
        foreach (var (_, indices) in groups)
        {
            if (indices.Count < 2) continue;
            var minScore = double.MaxValue;
            for (var i = 0; i < indices.Count; i++)
                for (var j = i + 1; j < indices.Count; j++)
                {
                    var key = indices[i] < indices[j] ? (indices[i], indices[j]) : (indices[j], indices[i]);
                    if (pairScores.TryGetValue(key, out var s) && s < minScore) minScore = s;
                }
            if (minScore == double.MaxValue) minScore = TierBThreshold;

            var trainings = indices.Select(idx => Map(candidates[idx], SimilarityTier.B, minScore)).ToList();
            result.Add(new DuplicateGroupDto
            {
                GroupKey = string.Join("-", indices.Select(idx => candidates[idx].Id).OrderBy(x => x)),
                Tier = nameof(SimilarityTier.B),
                MinScore = minScore,
                Trainings = trainings
            });
        }
        return result.OrderByDescending(g => g.Trainings.Count).ThenByDescending(g => g.MinScore).ToList();
    }

    private static (SimilarityTier? tier, double score) Score(
        Dictionary<int, int> draftDurations, int draftDuration, string? draftSignature, SimilarityCandidate candidate)
    {
        if (candidate.ActivityDurations.Count == 0) return (null, 0);

        var sameSig = !string.IsNullOrEmpty(draftSignature)
            && draftSignature == candidate.ActivitySignature;

        if (sameSig && TrainingSimilarity.IsTierADuration(draftDuration, candidate.Duration, TierADurationTolerance))
            return (SimilarityTier.A, 1.0);

        var jaccard = TrainingSimilarity.WeightedTimeJaccard(draftDurations, candidate.ActivityDurations);
        return jaccard >= TierBThreshold ? (SimilarityTier.B, jaccard) : (null, jaccard);
    }

    private static SimilarTrainingDto Map(SimilarityCandidate c, SimilarityTier tier, double score)
        => new()
        {
            Id = c.Id,
            Name = c.Name,
            IsDraft = c.IsDraft,
            Duration = c.Duration,
            CreatedByUserId = c.CreatedByUserId,
            Tier = tier.ToString(),
            Score = score,
            AppointmentCount = c.AppointmentCount
        };
}
