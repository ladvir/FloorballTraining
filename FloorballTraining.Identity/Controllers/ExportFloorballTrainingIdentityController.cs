using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

using FloorballTraining.Identity.Data;

namespace FloorballTraining.Identity.Controllers
{
    public partial class ExportFloorballTrainingIdentityController : ExportController
    {
        private readonly FloorballTrainingIdentityContext context;
        private readonly FloorballTrainingIdentityService service;

        public ExportFloorballTrainingIdentityController(FloorballTrainingIdentityContext context, FloorballTrainingIdentityService service)
        {
            this.service = service;
            this.context = context;
        }

        [HttpGet("/export/FloorballTrainingIdentity/activities/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/activities/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivitiesToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetActivities(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/activities/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/activities/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivitiesToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetActivities(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/activityagegroups/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/activityagegroups/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityAgeGroupsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetActivityAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/activityagegroups/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/activityagegroups/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityAgeGroupsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetActivityAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/activityequipments/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/activityequipments/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityEquipmentsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetActivityEquipments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/activityequipments/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/activityequipments/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityEquipmentsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetActivityEquipments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/activitymedia/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/activitymedia/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityMediaToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetActivityMedia(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/activitymedia/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/activitymedia/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityMediaToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetActivityMedia(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/activitytags/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/activitytags/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityTagsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetActivityTags(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/activitytags/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/activitytags/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportActivityTagsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetActivityTags(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/agegroups/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/agegroups/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportAgeGroupsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/agegroups/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/agegroups/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportAgeGroupsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/appointments/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/appointments/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportAppointmentsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetAppointments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/appointments/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/appointments/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportAppointmentsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetAppointments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/clubs/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/clubs/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportClubsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetClubs(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/clubs/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/clubs/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportClubsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetClubs(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/equipments/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/equipments/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportEquipmentsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetEquipments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/equipments/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/equipments/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportEquipmentsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetEquipments(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/members/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/members/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportMembersToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetMembers(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/members/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/members/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportMembersToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetMembers(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/places/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/places/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportPlacesToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetPlaces(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/places/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/places/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportPlacesToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetPlaces(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/repeatingpatterns/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/repeatingpatterns/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportRepeatingPatternsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetRepeatingPatterns(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/repeatingpatterns/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/repeatingpatterns/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportRepeatingPatternsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetRepeatingPatterns(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/tags/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/tags/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTagsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTags(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/tags/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/tags/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTagsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTags(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/teammembers/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/teammembers/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTeamMembersToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTeamMembers(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/teammembers/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/teammembers/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTeamMembersToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTeamMembers(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/teams/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/teams/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTeamsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTeams(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/teams/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/teams/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTeamsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTeams(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/trainingagegroups/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/trainingagegroups/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingAgeGroupsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTrainingAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/trainingagegroups/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/trainingagegroups/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingAgeGroupsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTrainingAgeGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/traininggroups/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/traininggroups/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingGroupsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTrainingGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/traininggroups/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/traininggroups/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingGroupsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTrainingGroups(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/trainingparts/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/trainingparts/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingPartsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTrainingParts(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/trainingparts/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/trainingparts/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingPartsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTrainingParts(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/trainings/csv")]
        [HttpGet("/export/FloorballTrainingIdentity/trainings/csv(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingsToCSV(string fileName = null)
        {
            return ToCSV(ApplyQuery(await service.GetTrainings(), Request.Query, false), fileName);
        }

        [HttpGet("/export/FloorballTrainingIdentity/trainings/excel")]
        [HttpGet("/export/FloorballTrainingIdentity/trainings/excel(fileName='{fileName}')")]
        public async Task<FileStreamResult> ExportTrainingsToExcel(string fileName = null)
        {
            return ToExcel(ApplyQuery(await service.GetTrainings(), Request.Query, false), fileName);
        }
    }
}
