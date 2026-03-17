namespace FloorballTraining.UseCases.Trainings;

public class ValidateAllTrainingsUseCase(
    IViewTrainingsAllUseCase viewTrainingsAllUseCase,
    IValidateTrainingUseCase validateTrainingUseCase)
    : IValidateAllTrainingsUseCase
{
    public async Task<(int Total, int ValidCount, int DraftCount)> ExecuteAsync()
    {
        var allTrainings = await viewTrainingsAllUseCase.ExecuteAsync();

        var validCount = 0;
        var draftCount = 0;

        foreach (var training in allTrainings)
        {
            var result = await validateTrainingUseCase.ExecuteAsync(training.Id);
            if (result.IsDraft) draftCount++; else validCount++;
        }

        return (allTrainings.Count, validCount, draftCount);
    }
}
