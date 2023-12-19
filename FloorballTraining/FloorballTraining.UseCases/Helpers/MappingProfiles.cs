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


                .ForMember(t => t.ParentTag, o => o.MapFrom(s => (s.ParentTag != null) ? s.ParentTag.Name : ""));


        }
    }
}
