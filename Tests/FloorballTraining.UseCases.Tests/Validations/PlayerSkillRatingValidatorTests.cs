using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Validations;
using FluentValidation.TestHelper;

namespace FloorballTraining.UseCases.Tests.Validations;

public class PlayerSkillRatingValidatorTests
{
    private readonly PlayerSkillRatingValidator _validator = new();

    [Theory]
    [InlineData(1)]
    [InlineData(3)]
    [InlineData(5)]
    public void Grade_within_range_is_valid(int grade)
    {
        var rating = new PlayerSkillRating { MemberId = 1, SkillId = 101, Grade = grade };

        _validator.TestValidate(rating).ShouldNotHaveValidationErrorFor(r => r.Grade);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-1)]
    public void Grade_outside_range_is_invalid(int grade)
    {
        var rating = new PlayerSkillRating { MemberId = 1, SkillId = 101, Grade = grade };

        _validator.TestValidate(rating).ShouldHaveValidationErrorFor(r => r.Grade);
    }

    [Fact]
    public void Null_target_grade_is_valid()
    {
        var rating = new PlayerSkillRating { MemberId = 1, SkillId = 101, Grade = 3, TargetGrade = null };

        _validator.TestValidate(rating).ShouldNotHaveValidationErrorFor(r => r.TargetGrade);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    public void Target_grade_within_range_is_valid(int targetGrade)
    {
        var rating = new PlayerSkillRating { MemberId = 1, SkillId = 101, Grade = 3, TargetGrade = targetGrade };

        _validator.TestValidate(rating).ShouldNotHaveValidationErrorFor(r => r.TargetGrade);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void Target_grade_outside_range_is_invalid(int targetGrade)
    {
        var rating = new PlayerSkillRating { MemberId = 1, SkillId = 101, Grade = 3, TargetGrade = targetGrade };

        _validator.TestValidate(rating).ShouldHaveValidationErrorFor(r => r.TargetGrade);
    }
}
