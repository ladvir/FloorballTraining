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

        public async Task<Appointment?> GetAppointmentByIdAsync(int appointmentId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Appointments
                .Include(t => t.ParentAppointment)
                .Include(t => t.FutureAppointments)
                .FirstOrDefaultAsync(a => a.Id == appointmentId);
        }


        public async Task UpdateAppointmentAsync(Appointment appointment)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();


            var existingAppointment = await db.Appointments.FirstOrDefaultAsync(e => e.Id == appointment.Id);

            if (existingAppointment == null)
            {
                await AddAppointmentAsync(appointment);
                return;
            }

            existingAppointment.Merge(appointment);

            if (appointment.Location != null) db.Entry(appointment.Location).State = EntityState.Unchanged;
            if (appointment.Team != null) db.Entry(appointment.Team).State = EntityState.Unchanged;

            await db.SaveChangesAsync();
        }

        public async Task AddAppointmentAsync(Appointment? appointment)
        {
            if (appointment == null) return;

            await using var db = await _dbContextFactory.CreateDbContextAsync();

            if (appointment.Location != null)
            {
                db.Entry(appointment.Location).State = EntityState.Unchanged;
            }

            if (appointment.Team != null)
            {
                db.Entry(appointment.Team).State = EntityState.Unchanged;
            }

            appointment.Location = null;
            appointment.Team = null;

            foreach (var fa in appointment.FutureAppointments)
            {
                fa.Location = null;
                fa.Team = null;
                fa.RepeatingPattern = null;
                fa.ParentAppointment = null;
                //fa.RepeatingPatternId = appointment.RepeatingPatternId;
            }

            if (appointment.RepeatingPattern != null)
            {
                appointment.RepeatingPattern.InitialAppointmentId = appointment.Id;
            }

            db.Appointments.Add(appointment);
            await db.SaveChangesAsync();


            appointment.RepeatingPatternId = appointment.RepeatingPattern?.Id;

            foreach (var fa in appointment.FutureAppointments)
            {
                fa.RepeatingPatternId = appointment.RepeatingPatternId;
            }


            db.Attach(appointment);
            await db.SaveChangesAsync();


        }

        public async Task DeleteAppointmentAsync(AppointmentDto appointment)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingAppointment = await GetAppointmentByIdAsync(appointment.Id);

            if (existingAppointment == null) throw new Exception("Událost nenalezena");

            if (existingAppointment.RepeatingPattern != null)
            {
                db.RepeatingPatterns.Remove(existingAppointment.RepeatingPattern);
            }


            if (existingAppointment.FutureAppointments.Any())
            {
                db.Appointments.RemoveRange(existingAppointment.FutureAppointments);
            }

            if (existingAppointment.ParentAppointment != null)
            {
                db.Entry(existingAppointment.ParentAppointment).State = EntityState.Unchanged;

                existingAppointment.ParentAppointment = null;
            }
            db.Appointments.Remove(existingAppointment);

            await db.SaveChangesAsync();
        }
    }
}