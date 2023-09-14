using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;

namespace FloorballTraining.Plugins.InMemory
{
    public class EquipmentRepository : IEquipmentRepository
    {

        public readonly List<Equipment> Equipments = new()
        {
            new Equipment { EquipmentId = 1, Name = "Rozlišovací dresy"},
            new Equipment { EquipmentId = 2, Name = "Kužely"},
            new Equipment { EquipmentId = 3, Name = "Skočky"},
            new Equipment { EquipmentId = 4, Name = "Žebřík"},
            new Equipment { EquipmentId = 5, Name = "Švihadlo"},
            new Equipment { EquipmentId = 6, Name = "Fotbalový míč"},
            new Equipment { EquipmentId = 7, Name = "Florbalové míčky"},
            new Equipment { EquipmentId = 8, Name = "Florbalová branka"}
        };
        public async Task<IEnumerable<Equipment>> GetEquipmentsByNameAsync(string searchString)
        {
            if (string.IsNullOrWhiteSpace(searchString)) return await Task.FromResult<IEnumerable<Equipment>>(Equipments);

            return await Task.FromResult(Equipments.Where(e => e.Name.Contains(searchString)));
        }

        public async Task<Equipment> GetEquipmentByNameAsync(string searchString)
        {
            if (string.IsNullOrWhiteSpace(searchString)) return await Task.FromResult<Equipment>(Equipments.First());

            return await Task.FromResult(Equipments.FirstOrDefault(e => e.Name.Contains(searchString)) ?? new Equipment());
        }

        public async Task<bool> ExistsEquipmentByNameAsync(string searchString)
        {
            return await Task.FromResult(Equipments.FirstOrDefault(e => e.Name.Contains(searchString)) != null);
        }

        public Task UpdateEquipmentAsync(Equipment equipment)
        {
            var existingEquipment = (Equipments.FirstOrDefault(a => a.EquipmentId == equipment.EquipmentId) ?? new Equipment())
                                    ?? throw new Exception("Vybavení nenalezeno nenalezen");

            existingEquipment.Merge(equipment);

            return Task.CompletedTask;
        }

        public async Task<Equipment> GetEquipmentByIdAsync(int equipmentId)
        {
            var existingEquipment = Equipments.FirstOrDefault(a => a.EquipmentId == equipmentId) ?? new Equipment();

            return await Task.FromResult(existingEquipment.Clone());
        }

        public Task AddEquipmentAsync(Equipment equipment)
        {
            if (Equipments.Any(x => x.Name.Equals(equipment.Name, StringComparison.OrdinalIgnoreCase)))
                return Task.CompletedTask;

            var maxId = Equipments.Max(x => x.EquipmentId);
            equipment.EquipmentId = maxId + 1;

            Equipments.Add(equipment);

            return Task.CompletedTask;
        }



    }
}