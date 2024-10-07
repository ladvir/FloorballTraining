using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class AppointmentEFCoreFactory(IAppointmentRepository repository, IRepeatingPatternFactory repeatingPatternFactory, IPlaceRepository placeRepository, ITeamRepository teamRepository) : IAppointmentFactory
{
    public async Task<Appointment> GetMergedOrBuild(AppointmentDto? dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        var entity = await repository.GetByIdAsync(dto.Id) ?? new Appointment();

        await MergeDto(entity, dto);

        return entity;
    }

    public async Task MergeDto(Appointment entity, AppointmentDto dto)
    {
        entity.Id = dto.Id;
        entity.AppointmentType = dto.AppointmentType;
        entity.Start = dto.Start;
        entity.End = dto.End;
        entity.Name = dto.Name;
        entity.Description = dto.Description;

        var team = await teamRepository.GetByIdAsync(dto.TeamId);
        entity.TeamId = team!.Id;
        entity.Team = team;

        entity.TrainingId = dto.TrainingId;
        if (dto.RepeatingPattern != null)
            entity.RepeatingPattern = await repeatingPatternFactory.GetMergedOrBuild(dto.RepeatingPattern);
        entity.RepeatingPatternId = entity.RepeatingPattern?.Id;


        if (dto.ParentAppointment != null)
            entity.ParentAppointment = await repository.GetAppointmentByIdAsync(dto.ParentAppointment.Id);
        entity.ParentAppointmentId = entity.ParentAppointment?.Id;

        entity.Name = dto.Name;
        entity.Description = dto.Description;

        var place = await placeRepository.GetByIdAsync(dto.LocationId);
        entity.Location = place;
        entity.LocationId = place!.Id;

        if (dto.FutureAppointments.Any())
        {
            foreach (var fa in dto.FutureAppointments)
            {
                entity.FutureAppointments.Add(await GetMergedOrBuild(fa));
            }
        }




    }
}