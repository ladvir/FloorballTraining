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
            CreateMap<Activity, ActivityNameAndDescriptionDto>();
            CreateMap<ActivityTag, ActivityTagDto>();
            CreateMap<ActivityAgeGroup, ActivityAgeGroupDto>();
            CreateMap<ActivityEquipment, ActivityEquipmentDto>();
            CreateMap<ActivityMedia, ActivityMediaDto>();
            CreateMap<ActivitySkill, ActivitySkillDto>()
                .ForMember(t => t.SkillName, o => o.MapFrom(s => s.Skill != null ? s.Skill.Name : null))
                .ForMember(t => t.SkillCategoryId, o => o.MapFrom(s => s.Skill != null ? s.Skill.SkillCategoryId : (int?)null))
                .ForMember(t => t.SkillCategoryName, o => o.MapFrom(s => s.Skill != null && s.Skill.SkillCategory != null ? s.Skill.SkillCategory.Name : null));

            CreateMap<Activity, ActivityDto>();

            CreateMap<Skill, SkillDto>()
                .ForMember(t => t.SkillCategoryName, o => o.MapFrom(s => s.SkillCategory != null ? s.SkillCategory.Name : null));

            CreateMap<TrainingTag, TrainingTagDto>();

            CreateMap<Training, TrainingDto>()
                .ForMember(t => t.IsDraft, o => o.MapFrom(s => s.IsDraft))
                .ForMember(t => t.IsIndividual, o => o.MapFrom(s => s.IsIndividual))
                .ForMember(t => t.TrainingTags, o => o.MapFrom(s => s.TrainingTags))
                .ForMember(t => t.NoSpecificGoal, o => o.MapFrom(s => s.NoSpecificGoal))
                .ForMember(t => t.TrainingGoalSkill1, o => o.MapFrom(s => s.TrainingGoalSkill1))
                .ForMember(t => t.TrainingGoalSkill2, o => o.MapFrom(s => s.TrainingGoalSkill2))
                .ForMember(t => t.TrainingGoalSkill3, o => o.MapFrom(s => s.TrainingGoalSkill3))
                .ForMember(t => t.TrainingAgeGroups, o => o.MapFrom(s => s.TrainingAgeGroups.Select(t => t.AgeGroup)))
                ;

            CreateMap<TrainingPart, TrainingPartDto>();
            CreateMap<TrainingGroup, TrainingGroupDto>();
            CreateMap<TrainingAgeGroup, AgeGroupDto>();
            CreateMap<Club, ClubDto>();
            CreateMap<Member, MemberDto>()
                .ForMember(dest => dest.MemberTeamMembers, opt => opt.Ignore());
            CreateMap<Team, TeamDto>();
            CreateMap<TeamMember, TeamMemberDto>()
                .ForMember(dest => dest.Team, opt => opt.Ignore());
            CreateMap<Place, PlaceDto>();
            CreateMap<Appointment, AppointmentDto>()
                .ForMember(dest => dest.TrainingTargets, opt =>
                    opt.MapFrom(src => src.Training!=null ? $"{src.Training.GetTrainingGoalsNames()}" : null))
                .ForMember(dest => dest.Tests, opt => opt.Ignore())
                .ForMember(dest => dest.TestDefinitionIds, opt => opt.Ignore());

            CreateMap<RepeatingPattern, RepeatingPatternDto>();
            
            CreateMap<Season, SeasonDto>()
                .ForMember(dest => dest.ClubName, opt => opt.MapFrom(src => src.Club != null ? src.Club.Name : null));
        }
    }
}
