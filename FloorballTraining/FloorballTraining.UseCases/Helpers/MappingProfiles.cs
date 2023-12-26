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

            CreateMap<Place, PlaceDto>()
                .ForMember(t => t.Environment, o => o.MapFrom(s => s.Environment.ToString()));
        }
    }

    public class Pagination<T> where T : class
    {
        public Pagination(int pageIndex, int pageSize, int totalItems, IReadOnlyList<T> data)
        {
            PageIndex = pageIndex;
            PageSize = pageSize;
            Count = totalItems;
            Data = data;
        }

        public int PageIndex { get; set; }

        public int PageSize { get; set; }

        public int Count { get; set; }

        public IReadOnlyList<T> Data { get; set; }
    }
}
