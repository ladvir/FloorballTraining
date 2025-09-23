using FloorballTraining.CoreBusiness.Dtos;
using FluentValidation;

namespace FloorballTraining.CoreBusiness.Validations;

public class SeasonValidator : AbstractValidator<SeasonDto>
{
    private readonly int _maximalLengthName = 50;
 
    public SeasonValidator()
    {
        SetRules();
    }
 
    public SeasonValidator(
        int maximalLengthName = 50
    )
    {
        _maximalLengthName = maximalLengthName;
 
        SetRules();
    }
 
    private void SetRules()
    {
        RuleFor(t => t.Name)
            .NotEmpty().WithMessage("Zadej název sezóny")
            .MaximumLength(_maximalLengthName)
            .WithMessage($"Překročen limit {_maximalLengthName} znaků pro název sezóny");
 
        RuleFor(t => t.StartDate)
            .NotEmpty()
            .WithMessage("Zadej začátek sezóny");
        
        RuleFor(t => t.EndDate)
            .NotEmpty()
            .WithMessage("Zadej konec sezóny");
        
        RuleFor(a => a).Must(a => a.StartDate <= a.EndDate)
            .WithMessage("Začátek sezóny nemůže být později než její konec");
 
    }
}