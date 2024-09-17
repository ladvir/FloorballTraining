using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;


namespace FloorballTraining.Services
{
    public class AppointmentService : IAppointmentService
    {
        public void GenerateFutureAppointments(RepeatingPatternDto repeatingPattern, AppointmentDto template)
        {
            // Clear existing future appointments
            // repeatingPattern.FutureAppointments.Clear();

            if (repeatingPattern.RepeatingFrequency == RepeatingFrequency.Once) return;

            DateTime currentDate = GetNextDate(repeatingPattern, template.Start);



            while (repeatingPattern.EndDate == null || currentDate <= repeatingPattern.EndDate.Value.AddSeconds(-1))
            {
                if (currentDate >= DateTime.UtcNow) // Only consider future dates
                {
                    var newAppointment = new AppointmentDto
                    {
                        RepeatingPattern = repeatingPattern,
                        Start = currentDate,
                        End = currentDate.Add(template.End - template.Start),
                        AppointmentType = template.AppointmentType,
                        LocationId = template.LocationId,
                        TrainingName = template.TrainingName,
                        TeamId = template.TeamId,
                        TrainingId = template.TrainingId,
                        ParentAppointment = template
                    };

                    repeatingPattern.FutureAppointments.Add(newAppointment);
                    template.FutureAppointments.Add(newAppointment);
                }

                // Move to the next appointment date
                currentDate = GetNextDate(repeatingPattern, currentDate);
            }
        }

        private DateTime GetNextDate(RepeatingPatternDto repeatingPattern, DateTime currentDate)
        {
            return repeatingPattern.RepeatingFrequency switch
            {
                RepeatingFrequency.Daily => currentDate.AddDays(repeatingPattern.Interval),
                RepeatingFrequency.Weekly => currentDate.AddDays(7 * repeatingPattern.Interval),
                RepeatingFrequency.Monthly => currentDate.AddMonths(repeatingPattern.Interval),
                RepeatingFrequency.Once => repeatingPattern.EndDate.GetValueOrDefault(),
                RepeatingFrequency.Yearly => currentDate.AddYears(repeatingPattern.Interval),
                _ => currentDate
            };
        }

        public void UpdatePattern(RepeatingPatternDto repeatingPattern, AppointmentDto template, RepeatingFrequency repeatingFrequency, int interval, DateTime? endDate = null)
        {
            repeatingPattern.RepeatingFrequency = repeatingFrequency;
            repeatingPattern.Interval = interval;
            repeatingPattern.EndDate = endDate;

            // Regenerate future appointments based on the updated pattern
            GenerateFutureAppointments(repeatingPattern, template);
        }

    }
}
