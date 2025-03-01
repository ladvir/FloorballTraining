﻿using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class TeamMemberValidator : AbstractValidator<TeamMemberDto>
{
    public TeamMemberValidator()
    {
        SetRules();
    }

    private void SetRules()
    {
        RuleFor(t => t.Member)
             .Must(t => t != null && t.Id != 0)
             .WithMessage("Vyber člena klubu");

        RuleFor(t => t.Team)
            .Must(t => t != null && t.Id != 0)
            .WithMessage("Vyber tým");

        RuleFor(t => t)
            .Must(t => t.IsCoach || t.IsPlayer)
            .WithMessage("Vyber roli v týmu");
    }
}