using Microsoft.EntityFrameworkCore;
using TrainingDataAccess.DbContexts;
using TrainingDataAccess.Dtos;
using TrainingDataAccess.Models;

namespace TrainingDataAccess.Services.TagServices
{
    public class DatabaseTagService : ITagService
    {
        private readonly IDbContextFactory<TrainingDbContext> _trainingDbContextFactory;
        private readonly ITagFactory _tagFactory;

        public DatabaseTagService(IDbContextFactory<TrainingDbContext> trainingDbContextFactory, ITagFactory tagFactory)
        {
            _trainingDbContextFactory = trainingDbContextFactory;
            _tagFactory = tagFactory;
        }

        public async Task<Tag> CreateTag(TagDto tagDto)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            var tag = _tagFactory.Build(tagDto);

            return await CreateTag(tag);
        }

        public async Task<Tag> CreateTag(Tag tag)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();

            context.Add(tag);

            await context.SaveChangesAsync();
            return tag;
        }

        public async Task<List<TagDto>> GetAllTags()
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Tags.AsNoTracking().MapToDto().ToListAsync();
        }

        public async Task<List<TagDto>> GetTagsByParentName(string parentTagName)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Tags.AsNoTracking().Where(t => t.ParentTag != null && t.ParentTag.Name == parentTagName).MapToDto().ToListAsync();
        }

        public async Task<List<TagDto>> GetAllTagDtosByIds(IEnumerable<int> tagIds)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Tags.AsNoTracking().Where(t => tagIds.ToList().Distinct().Contains(t.TagId)).MapToDto().ToListAsync();
        }


        public async Task<List<Tag>> GetAllTagsByIds(IEnumerable<int> tagIds)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Tags.AsNoTracking().Where(t => tagIds.ToList().Distinct().Contains(t.TagId)).ToListAsync();
        }


        public async Task<TagDto> GetTag(int id)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            return await context.Tags.AsNoTracking().MapToDto().SingleAsync(a => a.TagId == id);
        }

        public async Task UpdateTag(TagDto tag)
        {
            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            context.Entry(tag).State = tag.TagId == 0 ?
                EntityState.Added :
                EntityState.Modified;

            await context.SaveChangesAsync();
        }

        public async Task DeleteTag(Tag tag)
        {
            //todo if (tag.IsCustomRoot) throw new Exception("Štítek nelze smazat");

            await using var context = await _trainingDbContextFactory.CreateDbContextAsync();
            context.Remove(tag);

            await context.SaveChangesAsync();
        }
    }


    public static class TagDtoConverter
    {

    }
}
