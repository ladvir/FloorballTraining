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
                .ForMember(t => t.ParentTagName, o => o.MapFrom(s => (s.ParentTag != null) ? s.ParentTag.Name : ""))
                //.ForMember(t => t.ParentTagId, o => o.MapFrom(s => s.ParentTag != null ? s.ParentTag.Id : 0))
                ;

            CreateMap<Place, PlaceDto>()
                .ForMember(t => t.Environment, o => o.MapFrom(s => s.Environment.ToString()));

            CreateMap<Equipment, EquipmentDto>();
            CreateMap<AgeGroup, AgeGroupDto>();

            CreateMap<Activity, ActivityBaseDto>();
            CreateMap<ActivityTag, ActivityTagDto>();
            CreateMap<ActivityAgeGroup, ActivityAgeGroupDto>();
            CreateMap<ActivityEquipment, ActivityEquipmentDto>();

            CreateMap<Activity, ActivityDto>();/*
                .ForMember(t => t.ActivityTags, o => o.MapFrom(s => s.ActivityTags.Select(t => t.Tag)))
                .ForMember(t => t.ActivityAgeGroups, o => o.MapFrom(s => s.ActivityAgeGroups.Select(t => t.AgeGroup)))
                .ForMember(t => t.ActivityEquipments, o => o.MapFrom(s => s.ActivityEquipments.Select(t => t.Equipment)));
                */



            CreateMap<Training, TrainingDto>()
                .ForMember(t => t.TrainingGoal, o => o.MapFrom(s => s.TrainingGoal))
                .ForMember(t => t.TrainingAgeGroups, o => o.MapFrom(s => s.TrainingAgeGroups.Select(t => t.AgeGroup)))

                ;

            CreateMap<TrainingPart, TrainingPartDto>();

            CreateMap<TrainingGroup, TrainingGroupDto>();

            CreateMap<TrainingAgeGroup, AgeGroupDto>();
        }
    }
}
