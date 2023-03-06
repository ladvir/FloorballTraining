using Microsoft.EntityFrameworkCore;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.TagServices
{
    public class DatabaseTagService : ITagService
    {
        private readonly IDbContextFactory<TrainingDbContext> _trainingDbContextFactory;

        public DatabaseTagService(IDbContextFactory<TrainingDbContext> trainingDbContextFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
        }

        public async Task<Tag> CreateTag(TagDto tagDto)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var tag = tagDto.MapTagDtoToDomain();

            return await CreateTag(tag);
        }

        public async Task<Tag> CreateTag(Tag tag)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            context.Add(tag);

            await context.SaveChangesAsync();
            return tag;
        }


        public async Task CreateCustomTag(TagDto dto)
        {
            var tag = dto.MapTagDtoToDomain();

            if (tag.IsRoot || !tag.ParentTag!.IsCustomRoot) throw new Exception("Štítek nelze vložit");

            await CreateTag(tag);
        }

        public async Task<List<TagDto>> GetAllTags()
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Tags.MapTagToDto().ToListAsync();
        }

        public async Task<List<TagDto>> GetTagsByParentName(string parentTagName)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();



            return await context.Tags.Where(t => t.ParentTag != null && t.ParentTag.Name == parentTagName).MapTagToDto().ToListAsync();
        }

        public async Task<List<TagDto>> GetAllTagsByIds(IEnumerable<int> tagIds)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Tags.Where(t => tagIds.ToList().Distinct().Contains(t.TagId.GetValueOrDefault())).MapTagToDto().ToListAsync();
        }

        public async Task<TagDto> GetTag(int id)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Tags.MapTagToDto().SingleAsync(a => a.TagId == id);
        }

        public async Task UpdateTag(TagDto tag)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            context.Entry(tag).State = tag.TagId is 0 or null ?
                EntityState.Added :
                EntityState.Modified;

            await context.SaveChangesAsync();
        }

        public async Task DeleteTag(Tag tag)
        {
            if (tag.IsCustomRoot) throw new Exception("Štítek nelze smazat");

            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            context.Remove(tag);

            await context.SaveChangesAsync();
        }
    }



    public class TagDto
    {
        public int? TagId { get; set; }

        public string? Name { get; set; }

        public int? ParentTagId { get; set; }

        public string? Color { get; set; }

        public TagDto() { }

        public TagDto(string name)
        {
            Name = name;
        }
    }

    public static class TagConverter
    {
        public static IQueryable<TagDto>
            MapTagToDto(this IQueryable<Tag> tags)
        {
            return tags.Select(t => new TagDto
            {
                TagId = t.TagId,
                Name = t.Name,
                ParentTagId = t.ParentTagId,
                Color = t.Color
            }

            );
        }



    }


    public static class TagDtoConverter
    {
        public static Tag MapTagDtoToDomain(this TagDto dto)
        {
            return new Tag
            {
                TagId = dto.TagId,
                Name = dto.Name,
                ParentTagId = dto.ParentTagId,
                Color = dto.Color


            };
        }
    }
}
