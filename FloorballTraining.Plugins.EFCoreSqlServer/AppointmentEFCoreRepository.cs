using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class AppointmentEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        : GenericEFCoreRepository<Appointment>(dbContextFactory), IAppointmentRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory = dbContextFactory;

        public async Task UpdateAppointmentAsync(Appointment appointment)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingAppointment = await db.Appointments.FirstOrDefaultAsync(e => e.Id == appointment.Id) ?? new Appointment();

            existingAppointment.Merge(appointment);

            await db.SaveChangesAsync();
        }

        public async Task AddAppointmentAsync(Appointment? appointment)
        {
            if (appointment == null) return;

            await using var db = await _dbContextFactory.CreateDbContextAsync();
            db.Appointments.Add(appointment);

            await db.SaveChangesAsync();
        }

        public async Task DeleteAppointmentAsync(AppointmentDto appointment)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingAppointment = await db.Appointments.FirstOrDefaultAsync(a => a.Id == appointment.Id) ?? throw new Exception($"Událost {appointment.Name} nenalezena");


            db.Appointments.Remove(existingAppointment);

            await db.SaveChangesAsync();

        }


    }
}