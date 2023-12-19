﻿using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class EquipmentEFCoreRepository : GenericEFCoreRepository<Equipment>, IEquipmentRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public EquipmentEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory) : base(dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;

        }

        public async Task<IReadOnlyList<Equipment>> GetEquipmentsByNameAsync(string searchString)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Equipments.Where(ag => string.IsNullOrWhiteSpace(searchString) || ag.Name.ToLower().Contains(searchString.ToLower())).OrderBy(e => e.Name)
                .Include(e => e.ActivityEquipments)
                .ThenInclude(ae => ae.Activity)
                .ToListAsync();
        }

        public async Task<bool> ExistsEquipmentByNameAsync(string searchString)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Equipments.FirstOrDefaultAsync(ag => ag.Name.ToLower().Contains(searchString.ToLower())) != null;
        }


        public async Task UpdateEquipmentAsync(Equipment equipment)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingEquipment = await db.Equipments.FirstOrDefaultAsync(e => e.Id == equipment.Id) ?? new Equipment();

            existingEquipment.Merge(equipment);


            if (equipment.ActivityEquipments.Any())
            {
                foreach (var activityEquipment in equipment.ActivityEquipments)
                {
                    if (activityEquipment.Activity != null)
                        db.Entry(activityEquipment.Activity).State = EntityState.Unchanged;
                }
            }

            await db.SaveChangesAsync();
        }

        public async Task<Equipment> GetEquipmentByIdAsync(int equipmentId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Equipments.FirstOrDefaultAsync(a => a.Id == equipmentId) ?? new Equipment();
        }

        public async Task AddEquipmentAsync(Equipment equipment)
        {

            if (await ExistsEquipmentByNameAsync(equipment.Name))
                return;

            await using var db = await _dbContextFactory.CreateDbContextAsync();
            db.Equipments.Add(equipment);

            await db.SaveChangesAsync();
        }

        public async Task DeleteEquipmentAsync(Equipment equipment)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingEquipment = await db.Equipments.FirstOrDefaultAsync(a => a.Id == equipment.Id) ?? throw new Exception($"Vybavení {equipment.Name} nenalezeno");

            //activity equipment
            var usedInActivities = await db.ActivityEquipments.AnyAsync(a => a.Equipment == existingEquipment);

            if (!usedInActivities)
            {
                db.Equipments.Remove(existingEquipment);

                await db.SaveChangesAsync();
            }
        }


    }
}