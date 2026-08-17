using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class PlayerSkillRatingValidator : AbstractValidator<PlayerSkillRating>
{
    public PlayerSkillRatingValidator()
    {
        SetRules();
    }

    private void SetRules()
    {
        RuleFor(r => r.Grade)
            .InclusiveBetween(1, 5)
            .WithMessage("Známka musí být v rozsahu 1-5.");

        RuleFor(r => r.TargetGrade)
            .InclusiveBetween(1, 5)
            .When(r => r.TargetGrade.HasValue)
            .WithMessage("Cílová známka musí být v rozsahu 1-5.");
    }
}
