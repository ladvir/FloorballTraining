using FloorballTraining.CoreBusiness.Dtos;

namespace FloorballTraining.CoreBusiness.Converters
{
    public static class AgeGroupToAgeGroupDtoConverter
    {
        public static AgeGroupDto ToDto(this AgeGroup entity)
        {
            if (entity == null) throw new ArgumentNullException(nameof(entity));

            return new AgeGroupDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description
            };
        }
    }
}