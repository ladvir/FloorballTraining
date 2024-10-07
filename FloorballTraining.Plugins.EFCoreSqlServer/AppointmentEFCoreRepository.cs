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

        public async Task UpdateAppointmentAsync(Appointment updatedAppointment, bool updateWholeChain)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var appointment = await db.Appointments
                .Include(t => t.ParentAppointment)
                .Include(t => t.FutureAppointments)
                .FirstOrDefaultAsync(a => a.Id == updatedAppointment.Id);

            if (appointment == null) throw new Exception("Událost nenalezena");


            // If the appointment has a parent, load the parent and its future appointments
            if (updateWholeChain)
            {
                appointment = appointment.ParentAppointment ?? appointment;
                appointment.Start = updatedAppointment.ParentAppointment?.Start ?? updatedAppointment.Start;
                appointment.End = updatedAppointment.ParentAppointment?.End ?? updatedAppointment.End;
            }
            else
            {
                appointment.Start = updatedAppointment.Start;
                appointment.End = updatedAppointment.End;
            }

            appointment.Name = updatedAppointment.Name;
            appointment.Description = updatedAppointment.Description;
            appointment.AppointmentType = updatedAppointment.AppointmentType;

            appointment.Location = null;
            appointment.LocationId = updatedAppointment.LocationId;
            appointment.Team = null;
            appointment.TeamId = updatedAppointment.TeamId;
            appointment.Training = null;
            appointment.TrainingId = updatedAppointment.TrainingId;

            appointment.RepeatingPatternId = updatedAppointment.RepeatingPatternId;
            appointment.RepeatingPattern = null;

            if (updateWholeChain)
            {

                appointment.ParentAppointment = null;
                appointment.ParentAppointmentId = updatedAppointment.ParentAppointmentId;

                await db.Entry(appointment).Collection(a => a.FutureAppointments).LoadAsync();

                var appointmentsForDelete = appointment.FutureAppointments
                    .Where(f => !updatedAppointment.FutureAppointments.Exists(fa => fa.Id == f.Id && fa.Id > 0))
                    .ToList();
                foreach (var existing in appointmentsForDelete)
                {
                    db.Appointments.Remove(existing);
                    appointment.FutureAppointments.Remove(existing);
                }

                foreach (var fa in updatedAppointment.FutureAppointments)
                {
                    var existingFutureAppointment =
                        appointment.FutureAppointments.FirstOrDefault(e => e.Id == fa.Id && fa.Id > 0);

                    if (existingFutureAppointment == null) // new appointment
                    {
                        fa.Location = null;
                        fa.Team = null;
                        fa.RepeatingPattern = null;
                        fa.ParentAppointment = null;
                        appointment.FutureAppointments.Add(fa);
                        continue;
                    }

                    existingFutureAppointment.Merge(fa);
                    existingFutureAppointment.Location = null;
                    existingFutureAppointment.Team = null;
                    existingFutureAppointment.RepeatingPattern = null;
                    existingFutureAppointment.ParentAppointment = null;
                }
            }
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
                fa.ParentAppointmentId = appointment.Id;
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

        public async Task DeleteAppointmentAsync(AppointmentDto appointment, bool alsoFutureAppointmentsToBeDeleted = false)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingAppointment = await GetAppointmentByIdAsync(appointment.Id);

            if (existingAppointment == null) throw new Exception("Událost nenalezena");

            if (existingAppointment.ParentAppointment != null)
            {
                db.Entry(existingAppointment.ParentAppointment).State = EntityState.Unchanged;

                existingAppointment.ParentAppointment = null;
            }

            if (existingAppointment.RepeatingPattern != null)
            {
                db.RepeatingPatterns.Remove(existingAppointment.RepeatingPattern);
            }

            if (existingAppointment.FutureAppointments.Any() && alsoFutureAppointmentsToBeDeleted)
            {
                db.Appointments.RemoveRange(existingAppointment.FutureAppointments);
            }
            else if (existingAppointment.FutureAppointments.Any() && !alsoFutureAppointmentsToBeDeleted)
            {
                foreach (var fa in existingAppointment.FutureAppointments)
                {
                    fa.ParentAppointmentId = null;
                }
            }


            db.Appointments.Remove(existingAppointment);

            await db.SaveChangesAsync();
        }
    }
}