﻿using FloorballTraining.CoreBusiness;
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

        public async Task<IEnumerable<Tag>> GetTagsByNameAsync(string searchString = "", bool trainingGoalsOnly = false)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();

            var tags = await db.Tags.Where(t =>
                    (string.IsNullOrWhiteSpace(searchString) || t.Name.ToLower().Contains(searchString.ToLower()))
                    && (!trainingGoalsOnly || t.IsTrainingGoal)).Include(t => t.ParentTag)
                .ToListAsync();

            SetParentTag(tags);
            return tags;
        }

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

        public async Task DeleteTagAsync(Tag tag)
        {
            await using var db = await _dbContextFactory.CreateDbContextAsync();
            var existingTag = await db.Tags.FirstOrDefaultAsync(a => a.TagId == tag.TagId) ?? throw new Exception($"Štítek {tag.Name} nenalezen");

            //activity tag
            var usedInActivities = await db.ActivityTags.AnyAsync(a => a.Tag!.TagId == existingTag.TagId);

            //training goal
            var usedInTrainings = await db.Trainings.AnyAsync(a => a.TrainingGoal!.TagId == existingTag.TagId);

            //is parent with children
            var usedAsParents = await db.Tags.AnyAsync(a => a.ParentTag != null && (a.ParentTag.TagId == existingTag.TagId || a.ParentTagId == existingTag.TagId));


            if (!usedInTrainings && !usedInActivities && !usedAsParents)
            {

                db.Tags.Remove(existingTag);

                await db.SaveChangesAsync();
            }
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