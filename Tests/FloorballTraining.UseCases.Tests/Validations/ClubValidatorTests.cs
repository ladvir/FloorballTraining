using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Validations;
using FluentValidation.TestHelper;

namespace FloorballTraining.UseCases.Tests.Validations;

public class ClubValidatorTests
{
    private readonly ClubValidator _validator = new();

    [Fact]
    public void Empty_name_is_invalid()
    {
        var dto = new ClubDto { Name = "" };

        _validator.TestValidate(dto).ShouldHaveValidationErrorFor(c => c.Name);
    }

    [Fact]
    public void More_than_one_main_coach_is_invalid()
    {
        var club = new ClubDto { Id = 1, Name = "FBC Test" };
        club.Members = new List<MemberDto>
        {
            new() { FirstName = "Jan", LastName = "Novák", Club = club, HasClubRoleMainCoach = true },
            new() { FirstName = "Petr", LastName = "Svoboda", Club = club, HasClubRoleMainCoach = true }
        };

        var result = _validator.TestValidate(club);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("jednoho hlavního trenéra"));
    }

    [Fact]
    public void Single_named_club_without_members_is_valid()
    {
        var dto = new ClubDto { Id = 1, Name = "FBC Test", Members = new List<MemberDto>() };

        _validator.TestValidate(dto).IsValid.Should().BeTrue();
    }
}
