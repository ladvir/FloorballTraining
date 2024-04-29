using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.PluginInterfaces.Factories;

public interface ITeamMemberFactory : IGenericFactory<TeamMember, TeamMemberDto>
{
}