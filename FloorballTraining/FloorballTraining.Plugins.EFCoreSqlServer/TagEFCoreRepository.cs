using FloorballTraining.CoreBusiness;
using FloorballTraining.UseCases.PluginInterfaces;
using Microsoft.EntityFrameworkCore;

namespace FloorballTraining.Plugins.EFCoreSqlServer
{
    public class TagEFCoreRepository : ITagRepository
    {
        private readonly IDbContextFactory<FloorballTrainingContext> _dbContextFactory;

        public TagEFCoreRepository(IDbContextFactory<FloorballTrainingContext> dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
        }

        public async Task<IEnumerable<Tag>> GetTagsByNameAsync(string searchString, bool trainingGoalsOnly)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var tags = await db.Tags.Where(t =>
                    (string.IsNullOrWhiteSpace(searchString) || t.Name.ToLower().Contains(searchString.ToLower()))
                    && (!trainingGoalsOnly || t.IsTrainingGoal)).Include(t => t.ParentTag)
                .ToListAsync();

            SetParentTag(tags);
            return tags;
            //return BuildTree(tags, tags);
        }

        //private List<Tag> BuildTree(List<Tag> tags, List<Tag> tagsOriginal)
        //{
        //    if (!tags.Any()) return new List<Tag>();
        //    var result = new List<Tag>();

        //    foreach (var tag in tags)
        //    {
        //        if (tag.ParentTag != null)
        //        {
        //            var parentTagId = tag.ParentTagId;

        //            var parent = tagsOriginal.First(t => t.TagId == parentTagId);

        //            if (!result.Contains(parent)) { result.Add(parent); }
        //            result = BuildTree(result);

        //            if (!result.Contains(tag)) { result.Add(tag); }
        //        }
        //        else
        //        {
        //            if (result.All(t => t.TagId != tag.TagId)) result.Add(tag);
        //        }
        //    }

        //    return result;
        //}

        public async Task<IEnumerable<Tag>> GetTagsByParentTagIdAsync(int? parentTagId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var tags = await db.Tags.Where(t => parentTagId.HasValue
                    ? t.ParentTag != null && t.ParentTag.TagId == parentTagId
                    : t.ParentTag == null).ToListAsync();

            SetParentTag(tags);

            return tags;
        }

        public async Task UpdateTagAsync(Tag tag)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingTag = (await db.Tags.FirstOrDefaultAsync(a => a.TagId == tag.TagId) ?? new Tag())
                              ?? throw new Exception("Štítek nenalezen");

            existingTag.Merge(tag);

            await db.SaveChangesAsync();
        }

        public async Task<Tag> GetTagByIdAsync(int tagId)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            return await db.Tags.Include(t => t.ParentTag).SingleOrDefaultAsync(t => t.TagId == tagId) ?? new Tag();
        }

        public async Task AddTagAsync(Tag tag)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            tag.ParentTagId = tag.ParentTag?.TagId;
            db.Tags.Add(tag);

            if (tag.ParentTag != null)
            {
                db.Entry(tag.ParentTag).State = EntityState.Unchanged;
            }

            await db.SaveChangesAsync();
        }

        public void SetParentTag(List<Tag> tags)
        {
            foreach (var tag in tags)
            {
                tag.ParentTag = tags.FirstOrDefault(t => t.TagId == tag.ParentTagId);
            }
        }

    }
}