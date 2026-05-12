using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;

namespace FloorballTraining.Services;

public interface IAppointmentService
{
    void GenerateFutureAppointments(AppointmentDto template, RepeatingFrequency repeatingFrequency, int interval, DateTime? endDate = null, bool updateAllFutureAppointments = true);
    void GenerateFutureAppointments(RepeatingPatternDto repeatingPattern, AppointmentDto template);
    void UpdatePattern(RepeatingPatternDto repeatingPattern, AppointmentDto template, RepeatingFrequency repeatingFrequency, int interval, DateTime? endDate = null);

    Task<byte[]?> GenerateWorkTimeExcel(AppointmentsExportDto exportData);

    /// <summary>
    /// Generates a single workbook with one worksheet per coach. Worksheet name is the coach name.
    /// All coaches in <paramref name="perCoachData"/> get a worksheet, even with no appointments.
    /// </summary>
    Task<byte[]?> GenerateBulkWorkTimeExcel(IEnumerable<AppointmentsExportDto> perCoachData, int year, int monthNumber);

    /// <summary>
    /// Single-coach workbook for a given month. Always returns a workbook,
    /// even when the coach has no appointments in the month.
    /// </summary>
    Task<byte[]> GenerateSingleCoachWorkbook(AppointmentsExportDto exportData, int year, int monthNumber);
}