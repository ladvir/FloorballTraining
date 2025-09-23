using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Specifications;

namespace FloorballTraining.UseCases.PluginInterfaces
{
    public interface ISeasonRepository : IGenericRepository<Season>
    {
        Task<int> AddSeasonAsync(Season season);
        Task<IEnumerable<Season>> GetSeasonsByClubIdAsync(int? clubId);
        Task UpdateSeasonAsync(Season season);
        Task DeleteSeasonAsync(int seasonId);
        
        Task <IEnumerable<Season>> GetWithSpecificationInclusiveAsync(SeasonsSpecificationInclusive specification);
    }
}
