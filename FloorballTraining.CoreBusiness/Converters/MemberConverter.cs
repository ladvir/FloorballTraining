using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters;

public static class MemberConverter
{
    public static MemberDto ToDto(this Member entity)
    {
        if (entity == null) throw new ArgumentNullException(nameof(entity));

        return new MemberDto
        {
            Id = entity.Id,
            FirstName = entity.FirstName,
            LastName = entity.LastName,
            BirthYear = entity.BirthYear,
            IsActive = entity.IsActive,
            Email = entity.Email,
            ClubId = entity.ClubId,
            Club = entity.Club?.ToDto() ?? new ClubDto(),
            HasClubRoleMainCoach = entity.HasClubRoleMainCoach,
            HasClubRoleManager = entity.HasClubRoleManager,
            HasClubRoleSecretary = entity.HasClubRoleSecretary,
            HasClubRoleCoach = entity.HasClubRoleCoach
        };
    }
}
