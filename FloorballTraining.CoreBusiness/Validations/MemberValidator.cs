using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class MemberValidator : AbstractValidator<MemberDto>
{
    private readonly int _maximalLengthName = 50;

    public MemberValidator()
    {
        SetRules();
    }

    public MemberValidator(
        int maximalLengthName = 50
    )
    {
        _maximalLengthName = maximalLengthName;

        SetRules();
    }

    private void SetRules()
    {
        RuleFor(t => t.Name)
            .NotEmpty().WithMessage("Zadej jméno člena klubu")
            .MaximumLength(_maximalLengthName)
            .WithMessage($"Překročen limit {_maximalLengthName} znaků pro jméno člena klubu");
    }
}