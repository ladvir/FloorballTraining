using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class MemberEFCoreFactory(ITeamFactory teamFactory, IMemberRepository repository) : IMemberFactory
{
    private readonly ITeamFactory _teamFactory = teamFactory;

    public async Task<Member> GetMergedOrBuild(MemberDto? dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));


        dto ??= new MemberDto();

        var entity = await repository.GetByIdAsync(dto.Id) ?? new Member();

        await MergeDto(entity, dto);

        return entity;
    }

    public Task MergeDto(Member entity, MemberDto dto)
    {
        Task.Run(() =>
           {
               entity.Id = dto.Id;
               entity.Name = dto.Name;
               entity.Email = dto.Email;
               entity.HasClubRoleMainCoach = dto.HasClubRoleMainCoach;
               entity.HasClubRoleManager = dto.HasClubRoleManager;
               entity.HasClubRoleSecretary = dto.HasClubRoleSecretary;
               entity.ClubId = dto.ClubId;

               //entity.Club = await _clubFactory.GetMergedOrBuild(dto.Club);



           });

        return Task.FromResult(entity);
    }
}