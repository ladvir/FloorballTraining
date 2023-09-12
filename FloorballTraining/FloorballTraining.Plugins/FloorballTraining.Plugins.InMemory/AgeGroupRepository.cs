using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.Plugins.InMemory
{
    public class AgeGroupRepository : IAgeGroupRepository
    {
        public List<AgeGroup> AgeGroups = new() {
            new AgeGroup { Description = "Kdokoliv", Name = "Kdokoliv", AgeGroupId = 0 },
            new AgeGroup {Description =  "U7 - předpřípravka", Name = "U7", AgeGroupId = 7},
            new AgeGroup {Description =  "U9 - přípravka", Name = "U9", AgeGroupId = 9},
            new AgeGroup { Description = "U11 - elévi", Name = "U11", AgeGroupId = 11},
            new AgeGroup {Description =  "U13 - ml. žáci", Name = "U13", AgeGroupId = 13},
            new AgeGroup {Description =  "U15 - st. žáci", Name = "U15", AgeGroupId = 15},
            new AgeGroup {Description =  "U17 - dorost", Name = "U17", AgeGroupId = 17},
            new AgeGroup {Description =  "U21 - junioři", Name = "U21", AgeGroupId = 21},
            new AgeGroup {Description =  "Dospělí", Name = "Dospeli", AgeGroupId = 23}
        };


        public async Task<IEnumerable<AgeGroup>> GetAgeGroupsByNameAsync(string searchString = "")
        {
            if (string.IsNullOrWhiteSpace(searchString)) return await Task.FromResult<IEnumerable<AgeGroup>>(AgeGroups);

            return await Task.FromResult(AgeGroups.Where(e => e.Name.Contains(searchString)));
        }
    }
}