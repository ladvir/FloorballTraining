using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;
using FloorballTraining.CoreBusiness.Enums;
using MudBlazor;

namespace FloorballTraining.WebApp.Shared
{
    public static class AppointmentHelper
    {
        public static Color GetMudColor(AppointmentType appointmentType)
        {
            var color = appointmentType switch
            {
                AppointmentType.Training => Color.Dark,
                AppointmentType.Match => Color.Error,
                AppointmentType.Camp => Color.Info,
                _ => Color.Secondary
            };

            return color;
        }

        public static string GetHtmlColor(AppointmentType appointmentType)
        {
            var color = appointmentType switch
            {
                AppointmentType.Training => "#DAF7A6",
                AppointmentType.Match => "#FF0000",
                AppointmentType.Camp => "#33CEFF",
                _ => "#EAEAEA"
            };

            return color;
        }

        public static string GetAppointmentIcon(AppointmentType appointmentType)
        {
            return appointmentType switch
            {
                AppointmentType.Training => "fa-solid fa-dumbbell",
                AppointmentType.Match => "fa-solid fa-flag-checkered",
                AppointmentType.Camp => "fa-solid fa-hand-peace",
                _ => "fa-solid fa-question"
            };

        }

        public static string? GetIcon(AppointmentType appointmentAppointmentType)
        {
            return appointmentAppointmentType switch
            {
                AppointmentType.Training => Icons.Material.Filled.FitnessCenter,
                AppointmentType.Camp => Icons.Material.Filled.Campaign,
                AppointmentType.Match => Icons.Material.Filled.SportsHockey,
                _ => Icons.Material.Filled.Drafts
            };
        }

        public static string GetDurationDescription(AppointmentDto appointment)
        {
            return (appointment.End.Date - appointment.Start.Date).Days > 0
                ? $"{appointment.Start:ddd d.M.yyyy hh:mm} - {appointment.End:ddd d.M.yyyy hh:mm} "
                : $"{appointment.Start:ddd d.M.yyyy hh:mm} - {appointment.End:hh:mm} ";
        }


        public static string GetStart(AppointmentDto appointment)
        {
            return $"{appointment.Start:hh:mm}";
        }
        public static Color GetAppointmentTypeColor(AppointmentDto appointment)
        {
            if (appointment.AppointmentType != AppointmentType.Training) return Color.Default;

            return appointment is { TrainingId: > 0 } ? Color.Success : Color.Error;
        }

        public static string GetAppointmentTypeDescription(AppointmentDto appointment)
        {

            if (appointment.AppointmentType != AppointmentType.Training) return appointment.AppointmentType.GetDescription();

            var description = appointment.AppointmentType.GetDescription();
            return appointment is { TrainingId: > 0 } ? $"{description} - {appointment.TrainingName}" : description;
        }
    }
}
