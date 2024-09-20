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
    }
}
