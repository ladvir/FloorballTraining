using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class MemberEFCoreFactory(IMemberRepository repository) : IMemberFactory
{
    public async Task<Member> GetMergedOrBuild(MemberDto? dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var entity = await repository.GetByIdAsync(dto.Id) ?? new Member();

        await MergeDto(entity, dto);

        return entity;
    }

    public Task MergeDto(Member entity, MemberDto dto)
    {
        entity.Id = dto.Id;
        entity.FirstName = dto.FirstName;
        entity.LastName = dto.LastName;
        entity.BirthYear = dto.BirthYear;
        entity.IsActive = dto.IsActive;
        entity.Gender = dto.Gender;
        entity.Email = dto.Email;
        entity.HasClubRoleClubAdmin = dto.HasClubRoleClubAdmin;
        entity.HasClubRoleMainCoach = dto.HasClubRoleMainCoach;
        entity.HasClubRoleCoach = dto.HasClubRoleCoach;
        entity.ClubId = dto.ClubId;

        // Only set the account link when supplied, so editing a member (which omits
        // AppUserId) never clears an existing link — unlinking goes through its own endpoint.
        if (!string.IsNullOrEmpty(dto.AppUserId))
            entity.AppUserId = dto.AppUserId;

        return Task.CompletedTask;
    }
}
