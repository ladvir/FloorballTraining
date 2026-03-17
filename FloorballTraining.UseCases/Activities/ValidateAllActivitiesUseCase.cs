using FloorballTraining.UseCases.Activities.Interfaces;

namespace FloorballTraining.UseCases.Activities;

public class ValidateAllActivitiesUseCase(
    IViewActivitiesAllUseCase viewActivitiesAllUseCase,
    IValidateActivityUseCase validateActivityUseCase)
    : IValidateAllActivitiesUseCase
{
    public async Task<(int Total, int ValidCount, int DraftCount)> ExecuteAsync()
    {
        var allActivities = await viewActivitiesAllUseCase.ExecuteAsync();

        var validCount = 0;
        var draftCount = 0;

        foreach (var activity in allActivities)
        {
            var result = await validateActivityUseCase.ExecuteAsync(activity.Id);
            if (result.IsDraft) draftCount++; else validCount++;
        }

        return (allActivities.Count, validCount, draftCount);
    }
}
