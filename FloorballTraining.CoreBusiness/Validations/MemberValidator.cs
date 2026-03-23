using System.Text.RegularExpressions;
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
        RuleFor(t => t.FirstName)
            .NotEmpty().WithMessage("Zadej jméno člena klubu")
            .MaximumLength(_maximalLengthName)
            .WithMessage($"Překročen limit {_maximalLengthName} znaků pro jméno člena klubu");

        RuleFor(t => t.LastName)
            .NotEmpty().WithMessage("Zadej příjmení člena klubu")
            .MaximumLength(_maximalLengthName)
            .WithMessage($"Překročen limit {_maximalLengthName} znaků pro příjmení člena klubu");

        RuleFor(t => t.Club)
            .Must(t => t != null && t.Id != 0)
            .WithMessage("Zadej klub");

        RuleFor(t => t.Email)
            .Must(e => Regex.IsMatch(e, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            .When(e => !string.IsNullOrEmpty(e.Email))
            .WithMessage("Nesprávný email");
    }
}