using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.API.Validators.Ai;

public class ActivitySuggestionRequestValidator : AbstractValidator<ActivitySuggestionRequest>
{
    public ActivitySuggestionRequestValidator()
    {
        RuleFor(x => x.ClubId).GreaterThan(0);

        RuleFor(x => x.Criteria)
            .NotEmpty().WithMessage("Kritéria jsou povinná.")
            .MinimumLength(5).WithMessage("Popište hledané cvičení alespoň pár slovy.")
            .MaximumLength(2000).WithMessage("Kritéria mohou mít nejvýše 2000 znaků.");

        RuleFor(x => x.Count).InclusiveBetween(1, 3);
    }
}
