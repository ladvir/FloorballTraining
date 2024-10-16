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
                AppointmentType.Promotion => Color.Primary,
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
                AppointmentType.Promotion => "#ADC0FF",
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
                AppointmentType.Promotion => "fa-solid fa-handshake",
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
                AppointmentType.Promotion => Icons.Material.Filled.Handshake,
                _ => Icons.Material.Filled.Drafts
            };
        }

        public static string GetDurationDescription(AppointmentDto appointment)
        {
            return (appointment.End.Date - appointment.Start.Date).Days > 0
                ? $"{appointment.Start:ddd d.M.yyyy HH:mm} - {appointment.End:ddd d.M.yyyy HH:mm} "
                : $"{appointment.Start:HH:mm} - {appointment.End:HH:mm} ";
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

        public static string GetBackgroundColorRadzen(AppointmentDto appointment)
        {
            //if (appointment.ParentAppointment == null) return "var(--rz-warning-light)";

            return appointment.AppointmentType switch
            {
                AppointmentType.Match => "var(--rz-danger-light)",
                AppointmentType.Training when appointment.TrainingId == null => "var(--rz-success-light)",
                AppointmentType.Training when appointment.TrainingId != null => "var(--rz-success-dark)",
                AppointmentType.Camp => "var(--rz-info-dark)",
                AppointmentType.Promotion => "var(--rz-secondary-light)",
                _ => "var(--rz-info-light)"
            };
        }
        public static string GetColorRadzen(AppointmentDto appointment)
        {
            return appointment.AppointmentType switch
            {
                //AppointmentType.Match => "white",
                //AppointmentType.Training when appointment.TrainingId == null => "black",
                //AppointmentType.Training when appointment.TrainingId != null => "white",
                //AppointmentType.Camp => "white",
                _ => "white "
            };
        }

        public static string GetAppointmentTypeDescription(AppointmentDto appointment)
        {

            if (appointment.AppointmentType != AppointmentType.Training) return appointment.AppointmentType.GetDescription();

            var description = appointment.AppointmentType.GetDescription();
            return appointment is { TrainingId: > 0 } ? $"{description} - {appointment.TrainingName}" : description;
        }
    }
}
