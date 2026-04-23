using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness;

public static class TrainingSimilarity
{
    public static string? ComputeSignature(Training training)
    {
        var ids = ExtractActivityIds(training);
        return ComputeSignature(ids);
    }

    public static string? ComputeSignature(TrainingDto training)
    {
        var ids = ExtractActivityIds(training);
        return ComputeSignature(ids);
    }

    public static string? ComputeSignature(IEnumerable<int> activityIds)
    {
        var distinct = activityIds.Distinct().OrderBy(x => x).ToList();
        return distinct.Count == 0 ? null : string.Join(",", distinct);
    }

    public static Dictionary<int, int> GetActivityDurations(Training training)
    {
        var result = new Dictionary<int, int>();
        if (training.TrainingParts == null) return result;

        foreach (var part in training.TrainingParts)
        {
            if (part.TrainingGroups == null) continue;
            foreach (var group in part.TrainingGroups)
            {
                var id = group.ActivityId ?? group.Activity?.Id;
                if (id is null or 0) continue;
                result[id.Value] = result.GetValueOrDefault(id.Value) + part.Duration;
            }
        }
        return result;
    }

    public static Dictionary<int, int> GetActivityDurations(TrainingDto training)
    {
        var result = new Dictionary<int, int>();
        foreach (var part in training.TrainingParts)
        {
            if (part.TrainingGroups == null) continue;
            foreach (var group in part.TrainingGroups)
            {
                var id = group.Activity?.Id;
                if (id is null or 0) continue;
                result[id.Value] = result.GetValueOrDefault(id.Value) + part.Duration;
            }
        }
        return result;
    }

    /// <summary>
    /// Weighted Jaccard over activity → minutes.
    /// Σ min(t_a, t_b) / Σ max(t_a, t_b). 0 if both empty.
    /// </summary>
    public static double WeightedTimeJaccard(IReadOnlyDictionary<int, int> a, IReadOnlyDictionary<int, int> b)
    {
        if (a.Count == 0 && b.Count == 0) return 0;
        var keys = new HashSet<int>(a.Keys);
        keys.UnionWith(b.Keys);
        long minSum = 0, maxSum = 0;
        foreach (var k in keys)
        {
            a.TryGetValue(k, out var ta);
            b.TryGetValue(k, out var tb);
            minSum += Math.Min(ta, tb);
            maxSum += Math.Max(ta, tb);
        }
        return maxSum == 0 ? 0 : (double)minSum / maxSum;
    }

    public static bool IsTierADuration(int durationA, int durationB, double tolerance = 0.15)
    {
        if (durationA <= 0 || durationB <= 0) return durationA == durationB;
        var diff = Math.Abs(durationA - durationB);
        return diff <= durationA * tolerance;
    }

    private static IEnumerable<int> ExtractActivityIds(Training training)
    {
        if (training.TrainingParts == null) yield break;
        foreach (var part in training.TrainingParts)
        {
            if (part.TrainingGroups == null) continue;
            foreach (var group in part.TrainingGroups)
            {
                var id = group.ActivityId ?? group.Activity?.Id;
                if (id is not null and not 0) yield return id.Value;
            }
        }
    }

    private static IEnumerable<int> ExtractActivityIds(TrainingDto training)
    {
        foreach (var part in training.TrainingParts)
        {
            if (part.TrainingGroups == null) continue;
            foreach (var group in part.TrainingGroups)
            {
                var id = group.Activity?.Id;
                if (id is not null and not 0) yield return id.Value;
            }
        }
    }
}
