namespace FloorballTraining.UseCases.Errors.Interfaces;

public interface ISendErrorViaEmailUseCase
{
    Task ExecuteAsync(Exception exception, IReadOnlyList<string> to);
}