﻿using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class ClubValidator : AbstractValidator<ClubDto>
{
    private readonly int _maximalLengthName = 50;

    public ClubValidator()
    {
        SetRules();
    }

    public ClubValidator(
        int maximalLengthName = 50
    )
    {
        _maximalLengthName = maximalLengthName;

        SetRules();
    }

    private void SetRules()
    {
        RuleFor(t => t.Name)
                .NotEmpty().WithMessage("Zadej název klubu")
                .MaximumLength(_maximalLengthName)
                .WithMessage($"Překročen limit {_maximalLengthName} znaků pro název klubu");

        RuleForEach(tp => tp.Teams)
            .SetValidator(t => new TeamValidator());

        RuleForEach(tp => tp.Members)
            .SetValidator(t => new MemberValidator());
    }
}