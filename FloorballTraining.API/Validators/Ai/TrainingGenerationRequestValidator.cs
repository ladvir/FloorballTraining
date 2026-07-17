using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.API.Validators.Ai;

public class TrainingGenerationRequestValidator : AbstractValidator<TrainingGenerationRequest>
{
    public TrainingGenerationRequestValidator()
    {
        RuleFor(x => x.ClubId).GreaterThan(0);
        RuleFor(x => x.AgeGroupId).GreaterThan(0);
        RuleFor(x => x.DurationMinutes).InclusiveBetween(10, 300);
        RuleFor(x => x.PersonsMin).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PersonsMax).GreaterThanOrEqualTo(x => x.PersonsMin);
        RuleFor(x => x.Intensity).InclusiveBetween(1, 10).When(x => x.Intensity.HasValue);
        RuleFor(x => x.Notes).MaximumLength(1000);
        RuleFor(x => x.GoalTagIds).NotNull();
    }
}
