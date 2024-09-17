using AutoMapper;
using FloorballTraining.CoreBusiness;
using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.UseCases.Helpers
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            CreateMap<Tag, TagDto>()
                .ForMember(t => t.ParentTagName,
                o => o.MapFrom(s => (s.ParentTag != null) ? s.ParentTag.Name : ""));

            CreateMap<Place, PlaceDto>()
                .ForMember(t => t.Environment, o => o.MapFrom(s => s.Environment.ToString()));

            CreateMap<Equipment, EquipmentDto>();
            CreateMap<AgeGroup, AgeGroupDto>();

            CreateMap<Activity, ActivityBaseDto>();
            CreateMap<ActivityTag, ActivityTagDto>();
            CreateMap<ActivityAgeGroup, ActivityAgeGroupDto>();
            CreateMap<ActivityEquipment, ActivityEquipmentDto>();
            CreateMap<ActivityMedia, ActivityMediaDto>();

            CreateMap<Activity, ActivityDto>();

            CreateMap<Training, TrainingDto>()
                .ForMember(t => t.TrainingGoal1, o => o.MapFrom(s => s.TrainingGoal1))
                .ForMember(t => t.TrainingGoal2, o => o.MapFrom(s => s.TrainingGoal2))
                .ForMember(t => t.TrainingGoal3, o => o.MapFrom(s => s.TrainingGoal3))
                .ForMember(t => t.TrainingAgeGroups, o => o.MapFrom(s => s.TrainingAgeGroups.Select(t => t.AgeGroup)))

                ;

            CreateMap<TrainingPart, TrainingPartDto>();
            CreateMap<TrainingGroup, TrainingGroupDto>();
            CreateMap<TrainingAgeGroup, AgeGroupDto>();
            CreateMap<Club, ClubDto>();
            CreateMap<Member, MemberDto>();
            CreateMap<Team, TeamDto>();
            CreateMap<TeamMember, TeamMemberDto>();
            CreateMap<Place, PlaceDto>();
            CreateMap<Appointment, AppointmentDto>();

            CreateMap<RepeatingPattern, RepeatingPatternDto>();
        }
    }
}
