using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class TeamValidator : AbstractValidator<TeamDto>
{
    private readonly int _maximalLengthName = 50;

    public TeamValidator()
    {
        SetRules();
    }

    public TeamValidator(
        int maximalLengthName = 50
    )
    {
        _maximalLengthName = maximalLengthName;

        SetRules();
    }

    private void SetRules()
    {
        RuleFor(t => t.Name)
            .NotEmpty().WithMessage("Zadej název týmu")
            .MaximumLength(_maximalLengthName)
            .WithMessage($"Překročen limit {_maximalLengthName} znaků pro název týmu");


        RuleFor(t => t.Club)
            .Must(t => t != null && t.Id != 0)
            .WithMessage(t => "Zadej klub");

        RuleFor(t => t.AgeGroup)
            .Must(t => t != null)
            .WithMessage(t => $"Zadej věkovou kategorii pro tým {t.Id} - {t.Name}");



    }
}