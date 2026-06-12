using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;
using FloorballTraining.UseCases.Trainings;
using NSubstitute;

namespace FloorballTraining.UseCases.Tests.Trainings;

public class AddTrainingUseCaseTests
{
    private readonly ITrainingRepository _repository = Substitute.For<ITrainingRepository>();
    private readonly ITrainingFactory _factory = Substitute.For<ITrainingFactory>();

    [Fact]
    public async Task ExecuteAsync_forces_draft_persists_and_sets_generated_id()
    {
        var dto = new TrainingDto { Name = "Nový trénink", IsDraft = false };
        _factory.GetMergedOrBuild(dto).Returns(new Training { Id = 42 });

        var useCase = new AddTrainingUseCase(_repository, _factory);

        await useCase.ExecuteAsync(dto);

        dto.IsDraft.Should().BeTrue("new trainings always start as draft");
        dto.Id.Should().Be(42, "the persisted entity id flows back to the dto");
        await _repository.Received(1).AddTrainingAsync(Arg.Is<Training>(t => t.Id == 42));
    }
}
