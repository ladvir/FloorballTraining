using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.UseCases.PluginInterfaces;
using FloorballTraining.UseCases.PluginInterfaces.Factories;

namespace FloorballTraining.Plugins.EFCoreSqlServer.Factories;

public class RepeatingPatternEFCoreFactory(IRepeatingPatternRepository repository) : IRepeatingPatternFactory
{
    public async Task<RepeatingPattern> GetMergedOrBuild(RepeatingPatternDto? dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        var entity = await repository.GetByIdAsync(dto.Id) ?? new RepeatingPattern();

        await MergeDto(entity, dto);

        return entity;
    }



    public Task MergeDto(RepeatingPattern entity, RepeatingPatternDto dto)
    {

        entity.Id = dto.Id;
        entity.EndDate = dto.EndDate;
        entity.StartDate = dto.StartDate;
        entity.RepeatingFrequency = dto.RepeatingFrequency;
        //entity.InitialAppointmentId = dto.InitialAppointment.Id;
        entity.Interval = dto.Interval;
        return Task.CompletedTask;


        //entity.AppointmentParent = await appointmentFactory.GetMergedOrBuild(dto.AppointmentParent);

        //foreach (var futureAppointment in dto.FutureAppointments.Select(async trainingGroupDto => await appointmentFactory.GetMergedOrBuild(trainingGroupDto)))
        //{
        //    if (futureAppointment != null)
        //    {
        //        entity.FutureAppointments ??= [];


        //        entity.FutureAppointments.Add(await futureAppointment);
        //    }
        //}






    }
}