using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Trainings.Interfaces;

public interface ITrainingSimilarityService
{
    /// <summary>
    /// Compare draft against existing trainings. Scope = author union club members.
    /// Result includes per-row matchedByAuthor / matchedByClub flags.
    /// </summary>
    Task<List<SimilarTrainingDto>> FindSimilarForAsync(
        TrainingDto draft,
        string? authorUserId,
        IReadOnlyCollection<string>? clubMemberUserIds);

    /// <summary>
    /// Group all trainings in scope into duplicate clusters for the admin page.
    /// Tier A clusters: same activity signature. Tier B: union-find over weighted-Jaccard ≥ threshold pairs.
    /// </summary>
    Task<List<DuplicateGroupDto>> FindDuplicateGroupsAsync(
        SimilarityTier tier,
        IReadOnlyCollection<string>? userIdScope);
}
