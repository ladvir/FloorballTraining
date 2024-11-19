using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

using FloorballTraining.Web.Data;

namespace FloorballTraining.Web.Controllers
{
    public partial class ExportFloorballTrainingConfigurationController : ExportController
    {
        private readonly FloorballTrainingConfigurationContext context;
        private readonly FloorballTrainingConfigurationService service;

        public ExportFloorballTrainingConfigurationController(FloorballTrainingConfigurationContext context, FloorballTrainingConfigurationService service)
        {
            this.service = service;
            this.context = context;
        }

        [HttpGet("/export/FloorballTrainingConfiguration/activities/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/activities/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivitiesToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetActivities(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/activities/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/activities/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivitiesToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetActivities(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/activityagegroups/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/activityagegroups/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityAgeGroupsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetActivityAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/activityagegroups/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/activityagegroups/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityAgeGroupsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetActivityAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/activityequipments/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/activityequipments/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityEquipmentsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetActivityEquipments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/activityequipments/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/activityequipments/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityEquipmentsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetActivityEquipments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/activitymedia/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/activitymedia/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityMediaToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetActivityMedia(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/activitymedia/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/activitymedia/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityMediaToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetActivityMedia(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/activitytags/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/activitytags/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityTagsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetActivityTags(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/activitytags/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/activitytags/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityTagsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetActivityTags(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/agegroups/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/agegroups/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportAgeGroupsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/agegroups/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/agegroups/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportAgeGroupsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/appointments/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/appointments/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportAppointmentsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetAppointments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/appointments/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/appointments/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportAppointmentsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetAppointments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/clubs/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/clubs/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportClubsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetClubs(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/clubs/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/clubs/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportClubsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetClubs(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/equipments/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/equipments/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportEquipmentsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetEquipments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/equipments/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/equipments/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportEquipmentsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetEquipments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/members/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/members/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportMembersToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetMembers(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/members/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/members/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportMembersToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetMembers(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/places/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/places/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportPlacesToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetPlaces(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/places/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/places/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportPlacesToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetPlaces(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/repeatingpatterns/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/repeatingpatterns/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportRepeatingPatternsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetRepeatingPatterns(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/repeatingpatterns/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/repeatingpatterns/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportRepeatingPatternsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetRepeatingPatterns(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/tags/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/tags/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTagsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTags(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/tags/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/tags/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTagsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTags(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/teammembers/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/teammembers/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTeamMembersToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTeamMembers(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/teammembers/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/teammembers/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTeamMembersToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTeamMembers(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/teams/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/teams/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTeamsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTeams(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/teams/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/teams/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTeamsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTeams(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/trainingagegroups/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/trainingagegroups/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingAgeGroupsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTrainingAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/trainingagegroups/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/trainingagegroups/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingAgeGroupsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTrainingAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/traininggroups/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/traininggroups/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingGroupsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTrainingGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/traininggroups/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/traininggroups/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingGroupsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTrainingGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/trainingparts/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/trainingparts/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingPartsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTrainingParts(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/trainingparts/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/trainingparts/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingPartsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTrainingParts(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/trainings/csv")]
        [HttpGet("/export/FloorballTrainingConfiguration/trainings/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTrainings(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingConfiguration/trainings/excel")]
        [HttpGet("/export/FloorballTrainingConfiguration/trainings/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTrainings(), Request.Query, false), fileName);
        }
    }
}
