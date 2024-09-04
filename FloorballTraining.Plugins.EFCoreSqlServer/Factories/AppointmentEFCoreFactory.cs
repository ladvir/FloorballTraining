using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class AppointmentEFCoreFactory(IAppointmentRepository repository) : IAppointmentFactory
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
        await Task.Run(() =>
        {
            entity.Id = dto.Id;
            entity.Name = dto.Name;

            entity.AppointmentType = dto.AppointmentType;
            entity.Start = dto.Start;
            entity.Duration = dto.Duration;
            entity.TeamId = dto.TeamId;
            entity.TrainingId = dto.TrainingId;
            return Task.CompletedTask;
        }).ConfigureAwait(false);
    }
}